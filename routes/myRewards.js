const express = require('express');

const router = express.Router();

const myrewardsController = require('../controllers/MyRewardsController');
const myrewardsRequest = require('../request/MyRewardsRequest');

module.exports = (passport) => {

router.get(
    '/', 
    passport.authenticate("jwt", { session: false }),
    myrewardsRequest.get(), 
    myrewardsController.get
);

return router;
}
