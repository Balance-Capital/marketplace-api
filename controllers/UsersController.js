/* eslint-disable no-underscore-dangle */
const { validationResult } = require('express-validator');
const ShortUniqueId = require('short-unique-id');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_FOR_PASSWORD = parseInt(process.env.SALT_FOR_PASSWORD, 10) || 10;

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS
} = require('../constants/httpResponse');

const db = require('../models/index');
const logger = require('../services/logger');
const { 
  analytics, 
  EVENT_TYPE_IDENTIFY 
} = require('../services/analytics');

const generatePassword = (secret) => new Promise((resolve, reject) => {
  try {
    bcrypt.genSalt(SALT_FOR_PASSWORD, (errSalt, salt) => {
      if(errSalt) return reject(errSalt);
      return bcrypt.hash(secret, salt, (err, hash) => (err) ? reject(err) : resolve(hash));
    });  
  
  } catch (error) {
    logger.warning(`[UsersController] generatePassword issue ${error?.message}`, error)
    reject(error);
  }
});

const getNickName = async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };

  db.models.Users.findOne({ userName: req.body.username }).then((result) => {
    if(!result) {
      res.status(RESPONSE_STATUS_OK).json({allow: true});
    } else {
      res.status(409).json({ error: 'username exists'});      
    }
  });
}

const generateReferralsId = () => {
  const referral = new ShortUniqueId({ length: 10 });
  return referral();
}

const getUserIdFromJWToken = async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
  };

  const { token } = req.query;
  try {
    const user = jwt.decode(token);
    if(user?.id) {
      return res.status(RESPONSE_STATUS_OK).json({userId: user?.id});
    };  
    return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ error: 'wrong token'});
  } catch (error) {
    logger.warning(`[UsersController] getUserIdFromJWToken issue ${error?.message}`, error)
    return res.status(RESPONSE_STATUS_WRONG_PARAMS).json(error?.message);
  }  
}

const emailRegister = async (params) => {
  try {
    const { username, password, remoteAddressIp, cookieId, referralCode} = params;
    const exists = await db.models.Users.findOne({userName: username}).then((user) => !!user);
    if(exists) return false;
    const secret = await generatePassword(password);
    const referralId = generateReferralsId();
    const lastIp = remoteAddressIp;
    const email = username;
    return db.models.Users.insertMany({
      secret,
      cookieId: [cookieId],
      userName: username,
      referralId,
      email,
      lastIp,
      referralCode
    }).then(async ()=>{
      const user = await db.models.Users.findOne({userName: username}).exec();
      return {
        id: user?._id?.toString() || null,
        role: user?.role || null,
        balance: user?.balance || null,
        cookieId: user?.cookieId[0] || null,
        referralCode: user?.referralCode || null,
        avatar: user?.avatar || null
      };  
    });  
  } catch(error) {
    logger.warning(`[UsersController] emailRegister issue ${error?.message}`, error)
    return {
      id: null,
      role: null,
      balance: null,
      cookieId: null,
      referralCode: null,
      avatar: user?.avatar || null
    };
  }
}

const emailLogin = async(params) => {
  try {
    const { username, password, lastIp } = params;
    const usr = await db.models.Users.findOne({userName: username}).exec();
    if(!usr) return false;
    const ifTrue = await bcrypt.compare(password, usr.secret);
    if(ifTrue) {
      db.models.Users.updateOne(
        {_id: usr._id}, 
        { lastIp }
      )
      .exec();
      return {
        id: usr?._id?.toString() || null,
        role: usr?.role || null,
        balance: usr?.balance || null,
        cookieId: usr?.cookieId[0] || null,
        referralCode: usr?.referralCode || null,
        avatar: usr?.avatar || null
      };
    };
    return false;
  } catch (error) {
    logger.warning(`Email login issue: ${error?.message}`,error, params);
    return false;
  }
}

const getOrCreateUser = (cookieId, username, _secret, walletAddress, remoteAddressIp, email, displayName=null, externalId=null, externalProviderName=null, referralCode=null) => {
  try {
    return db.models.Users.findOne({ userName: username }).exec().then(async (result) => {
      if(!result) {
        const secret = await generatePassword(_secret);
        const referralId = generateReferralsId();
        const lastIp = remoteAddressIp;
        const firstName = displayName;
        return db.models.Users.insertMany({
          externalProviderName,
          externalId,
          secret,
          cookieId: [cookieId],
          userName: username,
          walletAccount: walletAddress,
          referralId,
          email,
          lastIp,
          firstName,
          referralCode
        }).then((users) => {
          const user = {
            id: users[0]?.id?.toString() || null,
            role: users[0]?.role || null,
            balance: users[0]?.balance || null,
            cookieId: users[0]?.cookieId[0] || null,
            referralCode: users[0]?.referralCode || null,
            avatar: users[0]?.avatar || null
          }
          db.models.Users.findOne({_id: user?.id}).exec().then((usr) => {
            analytics({
              anonymousId: usr?.cookieId[0],   
              userId: usr?._id?.toString(),
              event: EVENT_TYPE_IDENTIFY,
              eventMessage: {
                name: `${usr?.firstName} ${usr?.lastName}`,
                email: usr?.email,
                message: `Create account by ${externalProviderName}`
              }
            });        
          })
          return user
        }).catch((err) => {
          logger.warning(`Create or get user issue: ${err?.message}`, err);
          return {
            id: null,
            role: null,
            balance: null,
            cookieId: null,
            referralCode: null,
            avatar: null
          }
        })
      };
      // if(!result.cookieId.filter(item => item === cookieId).length) {
      //   db.models.Users.updateOne(
      //     {_id: result._id}, 
      //     { $push: {cookieId} }
      //   )
      //   .exec()
      // }
      const user = {
        id: result?._id?.toString() || null,
        role: result?.role || null,
        balance: result?.balance || null,
        cookieId: result?.cookieId[0] || null,
        referralCode: result?.referralCode || null,
        avatar: result?.avatar || null
      }
      return user;
    });

  } catch(error) {
    logger.warning(`[UsersController] getOrCreateUser issue ${error?.message}`, error)
    return {
      id: null,
      role: null,
      balance: null,
      cookieId: null,
      referralCode: null,
      avatar: null
    }    
  }
}

const getBalance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };
  const userId = req.headers.token.split(':')[0];
  const balance = await db.models.Users.getBalance(userId);
  res.status(200).json({balance});
}

const changeBalance = async (amountOperation = 0, userId, operationType = null) => {
  try {
    if(!operationType || !amountOperation || !userId) return -1;
    const userBalance = db.models.changeBalance(amountOperation, userId, operationType);
    return userBalance;  
  } catch(error) {
    logger.warning(`[UsersController] changeBalance issue ${error?.message}`, error)
    return -1;
  }
}

const changePassword = async (password, userId) => {
  try {
    if(!password || !userId) return false;
    const secret = await generatePassword(password);
    return await db.models.Users.findByIdAndUpdate({_id:userId}, {secret})
      .exec()
      .then((user) => user)
  } catch(error) {
    logger.warning(`Change password ${error?.message}`, error);
    return false;
  }
}

module.exports = { 
  getNickName, 
  getBalance, 
  changeBalance, 
  generateReferralsId, 
  getOrCreateUser, 
  emailRegister, 
  emailLogin,
  changePassword,
  getUserIdFromJWToken,
  generatePassword
};