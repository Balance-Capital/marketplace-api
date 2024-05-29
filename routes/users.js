const express = require('express');

const router = express.Router();

const usersController = require('../controllers/UsersController');
const usersRequest = require('../request/UsersRequest');

const tokenRequest = require('../request/TokenRequest');

router.get(
    '/balance', 
    tokenRequest.authToken(), 
    usersController.getBalance
);

router.get(
    '/get-nick-name', 
    usersRequest.getNickName(), 
    usersController.getNickName
);

router.get(
    '/id-from-token', 
    usersRequest.getUserId(), 
    usersController.getUserIdFromJWToken

);

module.exports = router;
