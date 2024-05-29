/* eslint-disable no-underscore-dangle */
const { check } = require('express-validator');
const i18n = require('../services/i18n');

const get = () => ([ 
    check('limit').optional().isNumeric().withMessage(i18n.__('requestLimit')),
    check('offset').optional().isNumeric().withMessage(i18n.__('requestLimit')),
    check('id').optional().isAlphanumeric().withMessage(i18n.__('requestId')),
    check('domain').optional().isURL().withMessage(i18n.__('requestDomain')),
    check('sessionId').isString().withMessage(i18n.__('requestSessionId')),
    check('country').optional().isString()
]);

module.exports = { get };