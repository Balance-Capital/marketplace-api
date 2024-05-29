const express = require('express');

const router = express.Router();

const visitorsController = require('../controllers/VisitorsController');
const visitorsRequest = require('../request/VisitorsRequest');

router.get(
    '/', 
    visitorsRequest.get(), 
    visitorsController.get
);

module.exports = router;
