/* eslint-disable no-underscore-dangle */
const { check, body } = require('express-validator');
const i18n = require('../services/i18n');

const get = () => ([ 
    check('limit').optional().isNumeric().withMessage(i18n.__('requestLimit')),
    check('offset').optional().isNumeric().withMessage(i18n.__('requestLimit')),
    check('version').optional().isNumeric().withMessage(i18n.__('requestVersion')),
    check('id').optional().isAlphanumeric().withMessage(i18n.__('requestId')),    
    check('sessionId').isString().withMessage(i18n.__('requestSessionId')),
    check('country').optional().isString()
]);

const create = () => ([ 
    body().isArray().withMessage(i18n.__('requestBody'))
]);

const askForLastOffersId = () => ([ 
]);

module.exports = { get, create, askForLastOffersId };