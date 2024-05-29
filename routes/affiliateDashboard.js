const express = require('express');

const router = express.Router();

const affiliateDashboardController = require('../controllers/AffiliateDashboardController');
const affiliateDashboardRequest = require('../request/AffiliateDashboardRequest');

module.exports = (passport) => {
    router.get(
        '/',
        passport.authenticate("jwt", { session: false }),
        affiliateDashboardRequest.get(),
        affiliateDashboardController.get
    );
    return router;
}
