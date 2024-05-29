/* eslint-disable no-underscore-dangle */
const { check, checkSchema } = require('express-validator');
const i18n = require('../services/i18n');

const get = () => ([ 
    checkSchema({
        querySearch: {
            in: ['params'],
            errorMessage: i18n.__('requestAlpha'),
            isString: true
        }
    }),
    check('sessionId').isString().withMessage(i18n.__('requestSessionId'))
]);

module.exports = { get };