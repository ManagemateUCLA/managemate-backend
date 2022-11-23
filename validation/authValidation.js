// VALIDATION 
const Joi = require('@hapi/joi');

const registerSchema = Joi.object().keys({
    email: Joi.string().min(6).messages({'string.pattern.base': `Must be a valid email`}).required().email(),
    password: Joi.string().min(6).messages({'string.pattern.base': `Password must be more than 5 characters`}).required(),
    name: Joi.string().min(4).messages({'string.pattern.base': `Name must be more than 3 characters`}).required()
});

const loginSchema = Joi.object().keys({
    email: Joi.string().min(6).messages({'string.pattern.base': `Must be a valid email`}).required().email(),
    password: Joi.string().min(6).messages({'string.pattern.base': `Password must be more than 5 characters`}).required()
});


// Register Validation 
const registerValidation = data => {
    const schema = registerSchema;
    return schema.validate(data);
};

// Login Validation 
const loginValidation = data => {
    const schema = loginSchema;
    return schema.validate(data);
};

module.exports.loginValidation = loginValidation;
module.exports.registerValidation = registerValidation;