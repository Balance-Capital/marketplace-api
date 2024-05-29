const express = require('express');

const router = express.Router();

const findAndReplaceCssController = require('../controllers/FindAndReplaceCssController');
const findAndReplaceCssRequest = require('../request/FindAndReplaceCssRequest');

router.post(
    '/', 
    findAndReplaceCssRequest.post(),
    findAndReplaceCssController.post
);

module.exports = router;
