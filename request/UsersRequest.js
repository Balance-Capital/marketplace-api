/* eslint-disable no-underscore-dangle */
const { body, check } = require('express-validator');
const i18n = require('../services/i18n');

const create = () => ([ 
    body('username').isString().optional().withMessage(i18n.__('userName')),
    body('secret').isString().withMessage(i18n.__('secret')),
    body('wallet').isString().withMessage(i18n.__('walletAddress')),
    body('sessionId').isString().withMessage(i18n.__('requestSessionId'))
]);

const getNickName = () => ([ 
    body('username').isString().withMessage(i18n.__('userName')),
    body('sessionId').isString().withMessage(i18n.__('requestSessionId'))
]);

const getUserId = () => ([ 
    check('token').isJWT()
]);

const forgotPassword = () => ([ 
    check('email').isEmail()
]);

const resetPassword = () => ([ 
    check('resetPasswordToken').isString(),
    check('password').isString().notEmpty().custom((dataIn) => dataIn?.length > 7).withMessage('password is too short')
]);

module.exports = { create, getNickName, forgotPassword, resetPassword, getUserId };