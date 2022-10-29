// creating a router 
const router = require('express').Router();
const RoommateGroup = require('../model/RoommateGroup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validation')

