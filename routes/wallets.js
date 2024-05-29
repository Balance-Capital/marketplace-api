const express = require('express');

const router = express.Router();

const walletController = require('../controllers/WalletController');
const walletRequest = require('../request/WalletRequest');

module.exports = (passport) => {

    router.get(
        '/', 
        walletRequest.getAll(), 
        passport.authenticate("jwt", { session: false }),
        walletController.getAll
    );

    router.delete(
        '/', 
        walletRequest.deleteOne(), 
        passport.authenticate("jwt", { session: false }),
        walletController.deleteOne
    );

    router.post(
        '/', 
        walletRequest.createOne(), 
        passport.authenticate("jwt", { session: false }),
        walletController.addNewOne
    );

    router.patch(
        '/', 
        walletRequest.setDefault(), 
        passport.authenticate("jwt", { session: false }),
        walletController.setDefault
    );

    return router;
}
