const express = require('express');

const router = express.Router();

const productsController = require('../controllers/ProductsController');
const productsRequest = require('../request/ProductsRequest');

router.get(
    '/', 
    productsRequest.get(), 
    productsController.get
);

module.exports = router;
