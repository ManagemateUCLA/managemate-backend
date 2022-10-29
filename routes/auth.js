// creating a router 
const router = require('express').Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validation')
// VALIDATION 
const Joi = require('@hapi/joi');

const schema = Joi.object().keys({
    name: Joi.string().min(6).required(), 
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required()
});

// /api/user/register 
router.post('/register', async (req, res) => {

    // LETS VALIDATE THE DATA
    const {error} = registerValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message); 

    // Checking if email exists 
    const emailExist = await User.findOne({email: req.body.email});
    if(emailExist) return res.status(400).send('Email already exists');

    // Hash the passwords 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create a User 
    const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        }); 
    
    try {
        const savedUser = await user.save();
        res.send({user: user._id});
    } catch(err) {
        res.status(400).send(err);
    }

});

router.get('/test', (req, res) => {
    res.send('Hello World, from express');
});

// login 
router.post('/login', async (req, res) => {
    // Lets Validate the data before we a user 
    const {error} = loginValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // Checking if email exists 
    const user = await User.findOne({email: req.body.email});
    if(!user) return res.status(400).send('User is not registered');

    // Password is correct 
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send('Invalid Password');

    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send(token);
});
module.exports = router;