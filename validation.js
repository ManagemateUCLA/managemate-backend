// VALIDATION 
const Joi = require('@hapi/joi');

// Register Validation 
const registerValidation = data => {
    const schema = Joi.object().keys({
        name: Joi.string().min(6).required(), 
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    });
    return schema.validate(data);
};

// Register Validation 
const loginValidation = data => {
    const schema = Joi.object().keys({
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    });
    return schema.validate(data);
};

module.exports.loginValidation = loginValidation;
module.exports.registerValidation = registerValidation;