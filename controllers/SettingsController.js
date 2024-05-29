/* eslint-disable no-underscore-dangle */
const { validationResult } = require('express-validator');
const { ObjectId } = require('bson');
const logger = require('../services/logger');
const jwt = require('jsonwebtoken');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS,
  RESPONSE_STATUS_ERROR,
  RESPONSE_STATUS_NO_FOUND
} = require('../constants/httpResponse');

const { TOKEN_TIMEOUT } = require('../constants/tokenTimeout');

const saveInfoInToBrowser = require('../utils/saveInfoInToBrowser');

const { getAllWalletsForUser } = require('./WalletController');
const db = require('../models/index');
const settingsResponse = require('../response/SettingsResponse');

const get = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };

  const userId = req?.user?.id || null;
  if(!userId) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };
  
  db.models.Users.findOne({_id: new ObjectId(userId)})
    .then(async (user) => {
      if(!user) {
        res.status(RESPONSE_STATUS_NO_FOUND).json([]);
        logger.warning(user);
        return;
      }
      const wallets = await getAllWalletsForUser(user._id) || null;
      const userInfo = {...user._doc, wallets};
      res.status(RESPONSE_STATUS_OK).json(settingsResponse(userInfo));
    })
    .catch((err) => {
      res.status(RESPONSE_STATUS_ERROR).json(err);
      logger.error(`[SettingsController] ${err?.message}, stack: ${err?.stack}`, req);
    })
}

const patch = async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };

  const { firstName, lastName, password, email, avatar } = req.body;

  const userId = req?.user?.id || null;
  if(!userId) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };

  db.models.Users.updateOne({_id: new ObjectId(userId) }, {
    firstName, lastName, password, email, avatar
  })
  .then(async (results) => {
    db.models.Users.findOne({_id: new ObjectId(userId)}).then((usr) => {
      const user = {
        id: usr?._id?.toString() || null,
        role: usr?.role || null,
        balance: usr?.balance || null,
        cookieId: usr?.cookieId[0] || null,
        referralCode: usr?.referralCode || null,
        avatar: usr?.avatar || null
      };
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: `${TOKEN_TIMEOUT}h` });
      saveInfoInToBrowser(res, usr, token);
      res.status(RESPONSE_STATUS_OK).json(settingsResponse(usr));        
    })
  })
  .catch((err) => {
    res.status(RESPONSE_STATUS_ERROR).json(err);
    logger.error(err);
  });
}

const deleteAvatar = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };

  const userId = req?.user?.id || null;
  if(!userId) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };

  db.models.Users.updateOne({_id: new ObjectId(userId) }, {
    avatar: null
  })
  .then((results) => {
    db.models.Users.findOne({_id: new ObjectId(userId)}).then((usr) => {
      const user = {
        id: usr?._id?.toString() || null,
        role: usr?.role || null,
        balance: usr?.balance || null,
        cookieId: usr?.cookieId[0] || null,
        referralCode: usr?.referralCode || null,
        avatar: usr?.avatar || null
      };
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: `${TOKEN_TIMEOUT}h` });
      saveInfoInToBrowser(res, usr, token);
      res.status(RESPONSE_STATUS_OK).json(settingsResponse(usr));        
    })
  })
  .catch((err) => {
    res.status(RESPONSE_STATUS_ERROR).json(err);
    logger.error(err);
  });
}

module.exports = { get, patch, deleteAvatar };