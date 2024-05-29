/* eslint-disable no-underscore-dangle */
require('dotenv').config();
const { body, query } = require('express-validator');
const i18n = require('../services/i18n');

const ACCESS_TOKEN = process.env.API_ACCESS_TOKEN || null;

const get = () => ([
    query('token')
        .isAlphanumeric()
        .custom((value) => value === ACCESS_TOKEN)
        .withMessage(i18n.__('refreshToken'))
]);

const post = () => ([ 
    body('storeId')
        .isAlphanumeric()
        .withMessage(i18n.__('requestId')),
    body('token')
        .isAlphanumeric()
        .custom((value) => value === ACCESS_TOKEN)
        .withMessage(i18n.__('refreshToken')),
    body('description')
        .optional()
        .isString()
        .withMessage(i18n.__('requestAlpha'))
]);

module.exports = { get, post };