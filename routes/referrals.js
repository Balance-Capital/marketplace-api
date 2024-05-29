const express = require('express');

const router = express.Router();

const referralsController = require('../controllers/ReferralsController');
const referralsRequest = require('../request/ReferralsRequest');

module.exports = (passport) => {

router.get(
    '/', 
    passport.authenticate("jwt", { session: false }),
    referralsRequest.get(), 
    referralsController.get
);

router.get(
    '/click', 
    referralsRequest.click(), 
    referralsController.setClick
);

return router;

}
