const express = require('express');

const router = express.Router();

const offersController = require('../controllers/OffersController');
const offersRequest = require('../request/OffersRequest');

router.get(
    '/ask-last-id', 
    offersRequest.askForLastOffersId(),
    offersController.askForLastOffersId
);

router.get(
    '/', 
    offersRequest.get(), 
    offersController.get
);

module.exports = router;
