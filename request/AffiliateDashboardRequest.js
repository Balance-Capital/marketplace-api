/* eslint-disable no-underscore-dangle */
const { header, check } = require('express-validator');
const i18n = require('../services/i18n');

const get = () => ([ 
    header('authorization').isString().withMessage(i18n.__('refreshToken')),
    check('dateStart').optional().isString(),
    check('page').optional().isNumeric()
]);

module.exports = { get };