const express = require('express');

const router = express.Router();

const withdrawController = require('../controllers/WithdrawController');
const withdrawRequest = require('../request/WithdrawRequest');

module.exports = (passport) => {

    router.post(
        '/', 
        withdrawRequest.create(), 
        passport.authenticate("jwt", { session: false }),
        withdrawController.create
    );

    return router;
}
