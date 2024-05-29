/* eslint-disable no-underscore-dangle */
const { body, header, query } = require('express-validator');
const i18n = require('../services/i18n');

const createOne = () => ([ 
    header('authorization').isString().withMessage(i18n.__('refreshToken')),
    body('walletAddress').isString().withMessage(i18n.__('walletAddress')),
    body('walletName').isString().withMessage(i18n.__('walletAddress'))
]);

const deleteOne = () => ([ 
    header('authorization').isString().withMessage(i18n.__('refreshToken')),
    query('walletAddress').isString().withMessage(i18n.__('walletAddress'))
]);

const setDefault = () => ([ 
    header('authorization').isString().withMessage(i18n.__('refreshToken')),
    body('walletAddress').isString().withMessage(i18n.__('walletAddress'))
]);

const getAll = () => ([ 
    header('authorization').isString().withMessage(i18n.__('refreshToken'))
]);

module.exports = { createOne, deleteOne, setDefault, getAll };