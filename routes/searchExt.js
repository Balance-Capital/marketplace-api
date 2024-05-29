const express = require('express');

const router = express.Router();

const storeController = require('../controllers/StoresController');
const searchRequest = require('../request/SearchRequest');

router.get(
    '/:querySearch', 
    searchRequest.get(),
    storeController.searchExt
);

module.exports = router;
