import { body } from 'express-validator';
import { validate } from '../../config/validate.js';



export const validateRegister = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required.')
        .isLength({ min: 6, max: 50 }).withMessage('Username should be between 6 and 50 characters.'),
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required.')
        .isLength({ min: 3, max: 50 }).withMessage('Name should be between 3 and 50 characters.'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('A valid email is required.'),
    body('password')
        .notEmpty().withMessage('Password is required.')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    validate
];

export const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('A valid email is required.'),
    body('password')
        .notEmpty().withMessage('Password is required.'),
    validate
];