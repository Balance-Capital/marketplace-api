/* eslint-disable no-underscore-dangle */
const { header, body } = require('express-validator');
const i18n = require('../services/i18n');

const get = () => ([ 
    header('authorization').isString().withMessage(i18n.__('refreshToken')),
    body('dateStart').optional().isString()
]);

module.exports = { get };