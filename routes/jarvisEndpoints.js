const express = require('express');

const router = express.Router();

const jarvisEndpointsController = require('../controllers/JarvisEndpointsController');
const jarvisEndpointsRequest = require('../request/JarvisEndpointsRequest');

router.get(
    '/description', 
    jarvisEndpointsRequest.get(),
    jarvisEndpointsController.getSeoDescription
);

router.get(
    '/jarvis', 
    jarvisEndpointsRequest.get(),
    jarvisEndpointsController.getJarvis
);

router.get(
    '/description/list', 
    jarvisEndpointsRequest.get(),
    jarvisEndpointsController.getListOfStores
);

router.post(
    '/description', 
    jarvisEndpointsRequest.update(), 
    jarvisEndpointsController.update
);

module.exports = router;
