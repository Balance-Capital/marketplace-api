/* eslint-disable no-underscore-dangle */
const { header, check } = require('express-validator');
const moment = require('moment');
const i18n = require('../services/i18n');
const db = require('../models/index');

const authToken = () => ([
    header('token').exists().withMessage(i18n.__('authTokenMissing')),
    // eslint-disable-next-line consistent-return
    check('token').custom( async value => {
        const token = value.split(':');
        if(token.length < 2) return Promise.reject(token)

        const result = await db.models.Users.findOne(
            {
                token: token[1], 
                tokenValidDate: { 
                    $gte: moment().toISOString()
                }
            }).exec();
        if(!result) return Promise.reject(result);
        return db.models.Users.findOneAndUpdate(
            {token:token[1]}, 
            {tokenValidDate:moment().add(10,'minutes').toISOString()}
        ).exec()
        .then((res) => Promise.resolve(res))
        .catch((err) => Promise.reject(err))
        ;
    }).withMessage(i18n.__('authTokenMissingOrExpired'))
]);

module.exports = { authToken };