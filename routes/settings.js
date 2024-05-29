const express = require('express');

const router = express.Router();

const settingsController = require('../controllers/SettingsController');
const settingsRequest = require('../request/SettingsRequest');

module.exports = (passport) => {

router.get(
    '/', 
    passport.authenticate("jwt", { session: false }),
    settingsRequest.get(), 
    settingsController.get
);

router.patch(
    '/', 
    passport.authenticate("jwt", { session: false }),    
    settingsRequest.patch(), 
    settingsController.patch
);

router.delete(
    '/', 
    passport.authenticate("jwt", { session: false }),    
    settingsRequest.deleteAvatar(), 
    settingsController.deleteAvatar
);

return router;

};