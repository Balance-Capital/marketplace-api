/* eslint-disable no-underscore-dangle */
const { body, header } = require('express-validator');
const i18n = require('../services/i18n');

const get = () => ([
    header('authorization').isString().withMessage(i18n.__('refreshToken')) 
]);

const patch = () => ([
    header('authorization').isString().withMessage(i18n.__('refreshToken')) ,
    body('firstName').isString().optional().withMessage(i18n.__('requestAlphanumeric')),
    body('lastName').isString().optional().withMessage(i18n.__('requestAlphanumeric')),
    body('email').isEmail().optional().withMessage(i18n.__('requestEmail')),
    body('password').isAlphanumeric().optional().withMessage(i18n.__('requestAlphanumeric')),
    body('avatar').isString().optional().withMessage(i18n.__('requestString'))
]);

const deleteAvatar = () => ([
    header('authorization').isString().withMessage(i18n.__('refreshToken'))
]);

module.exports = { get, patch, deleteAvatar };