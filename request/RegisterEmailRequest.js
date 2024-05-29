/* eslint-disable no-underscore-dangle */
const { body } = require('express-validator');
const i18n = require('../services/i18n');

const post = () => ([
    body('username').isEmail().withMessage(i18n.__('requestEmail')),
    body('password').isString().withMessage(i18n.__('secret')),
    body('offersNewsApprove').optional().isBoolean()
]);

module.exports = { post };