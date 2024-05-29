const express = require('express');

const router = express.Router();

const storesController = require('../controllers/StoresController');
const storesRequest = require('../request/StoresRequest');

const statisticsController = require('../controllers/StatisticsController');

router.get(
    '/stats/regions', 
    statisticsController.getStoresRegions
);
router.get(
    '/:domain', 
    storesRequest.get(), 
    storesController.get
);
router.get(
    '/', 
    storesRequest.get(), 
    storesController.get
);

module.exports = router;
