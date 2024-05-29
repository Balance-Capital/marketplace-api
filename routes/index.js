const express = require('express');

const router = express.Router();
const pugController = require('../controllers/PugController');
const pugRequest = require('../request/PugEndpointsRequest');

router.get(
    '/', 
    pugRequest.get(),
    pugController.get
);

router.post(
    '/', 
    pugRequest.post(),
    pugController.post
);

module.exports = router;
