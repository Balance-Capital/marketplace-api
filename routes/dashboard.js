const express = require('express');

const router = express.Router();

const dashBoardController = require('../controllers/DashBoardController');
const dashBoardRequest = require('../request/DashBoardRequest');

module.exports = (passport) => {

router.get(
    '/', 
    dashBoardRequest.get(), 
    passport.authenticate("jwt", { session: false }),    
    dashBoardController.get
);

return router;

}
