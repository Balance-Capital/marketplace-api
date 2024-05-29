/* eslint-disable no-underscore-dangle */
const { check, body } = require('express-validator');
const { ABOUT_OFFERS, FAQ, DESCRIPTION } = require('../constants/findAndReplaceFields');
const i18n = require('../services/i18n');

const post = () => ([
    body('findWhat').notEmpty().isString().withMessage(i18n.__('findWhat')),
    body('replaceWhat').notEmpty().isString().withMessage(i18n.__('replaceWhat')),
    body('test').isBoolean().withMessage(i18n.__('check:boolean')),
    check('token').isAlphanumeric().withMessage(i18n.__('refreshToken')),
    body('queryField').isIn([ABOUT_OFFERS,FAQ,DESCRIPTION]).withMessage(i18n.__('findAndReplacefields'))
]);

module.exports = { post };