/* eslint-disable no-underscore-dangle */
const { check, body, header } = require('express-validator');
const i18n = require('../services/i18n');

const get = () => ([
    header('authorization').isString().withMessage(i18n.__('refreshToken')),    
    check('dateStart').optional().isString(),
    check('page').optional().isNumeric()
]);

const post = () => ([
    body('id').isAlphanumeric().withMessage(i18n.__('requestReferralId')),
    body('url').isURL().withMessage(i18n.__('requestUrl')),
    body('sessionId').isString().withMessage(i18n.__('requestSessionId'))
]);

const click = () => ([
    check('referral').isAlphanumeric().withMessage(i18n.__('requestReferralId')),
    check('userAgent').optional().isString().withMessage(i18n.__('requestString'))
]);

module.exports = { get, post, click };