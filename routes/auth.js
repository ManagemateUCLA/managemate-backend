// creating a router
const router = require("express").Router();
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verify = require("./verifyJWTToken");

// Validate register and login fields
const {
    registerValidation,
    loginValidation,
} = require("../validation/authValidation");

// VALIDATION
const Joi = require("@hapi/joi");

// /auth/register
router.post("/register", async (req, res) => {
    // LETS VALIDATE THE DATA
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Checking if email or phone exists
    const emailExist = await User.findOne({ email: req.body.email });

    if (emailExist)
        return res.status(400).send("Email already exists");

    // Hash the passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create a User
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
    });
    console.log("Registering User", user);

    try {
        const savedUser = await user.save();
        res.send({ user: user._id });
    } catch (err) {
        res.status(400).send(err);
    }
});

// /auth/login
router.post("/login", async (req, res) => {
    // Lets Validate the data before we a user
    console.log(req.body);
    // const { error } = loginValidation(req.body);
    // if (error) return res.status(400).send(error.details[0].message);

    // Checking if email exists -> if not then user must register first
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(401).send("User is not registered");

    // Password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(401).send("Invalid Password");

    const token = jwt.sign(
        { _id: user._id, name: user.name, email: user.email },
        process.env.TOKEN_SECRET
    );

    res.send({token: token});
});

module.exports = router;