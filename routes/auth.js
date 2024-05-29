const express = require('express');

const router = express.Router();

const authController = require('../controllers/AuthController');
const registerEmailRequest = require('../request/RegisterEmailRequest');
const usersRequest = require('../request/UsersRequest');
const passportConfig = require('../auth/passportConfig');

module.exports = (passport) => {
    
    passportConfig(passport);

    router.get(
        '/login/google', 
        passport.authenticate('google')
    );

    router.get(
        '/redirect/google',
        passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
        authController.loginByGoogle
    );

    router.get(
        '/login/facebook', 
        passport.authenticate('facebook')
    );

    router.get(
        '/redirect/facebook',
        passport.authenticate('facebook', { failureRedirect: '/login', failureMessage: true }),
        authController.loginByFacebook
    );

    router.post(
        '/login/email',
        registerEmailRequest.post(),
        authController.loginByEmailWww
    );

    router.post(
        '/login/email/ext',
        registerEmailRequest.post(),
        authController.loginByEmailExtension
    );

    router.post(
        '/login/email/register',
        registerEmailRequest.post(),
        authController.registerByEmail
    );     

    router.get(
        '/forgot-password',
        usersRequest.forgotPassword(),
        authController.forgotPassword
    ); 

    router.get(
        '/reset-password',
        usersRequest.resetPassword(),
        authController.resetPassword
    ); 

    return router;
}