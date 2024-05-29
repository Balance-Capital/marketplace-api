/* eslint-disable no-underscore-dangle */
const { validationResult } = require('express-validator');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('bson');
const requestIP = require('request-ip');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_BAD_REQUEST,
  RESPONSE_STATUS_WRONG_PARAMS,
  RESPONSE_STATUS_CONFLICT_REQUEST,
  RESPONSE_STATUS_NO_FOUND,
  RESPONSE_STATUS_ERROR
} = require('../constants/httpResponse');

const {
  DEVELOPMENT,
  PRODUCTION,
  STAGING,
  TEST,
  DOMAIN_TEST_DEVELOPMENT,
  DOMAIN_TEST_STAGING,
  DOMAIN_TEST_PRODUCTION
} = require('../constants/enviroment');

const { TOKEN_TIMEOUT } = require('../constants/tokenTimeout');

const { COOKIE_NAME } = require('../constants/cookieName');

const saveInfoInToBrowser = require('../utils/saveInfoInToBrowser');

const { 
  emailRegister, 
  emailLogin,
  changePassword
} = require("./UsersController");

const logger = require('../services/logger');
const db = require('../models/index');
const {mailSend} = require('../services/mailSend');
const getCookies = require('../utils/getCookies');
const { 
  analytics, 
  EVENT_TYPE_TRACK, 
  EVENT_TYPE_IDENTIFY 
} = require('../services/analytics');

const logout = (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(RESPONSE_STATUS_BAD_REQUEST).json({ errors: errors.array() });
      return;
    };
  
    const cookies = getCookies(req);
    const cookieId = cookies[COOKIE_NAME] || null;

    db.models.Users.findOneAndUpdate(
      {token: req?.headers?.token},
      {token: null, tokenValidDate:null}
    ).exec().catch((err) => logger.warning(`Logout ${err?.message}, ${err?.stack}`, err));

    res.status(RESPONSE_STATUS_OK).json();
    
    db.models.Users.findOne({token: req?.headers?.token},{_id:1}).exec().then((user) => {
      if(user) {
        analytics({
          anonymousId: cookieId,
          userId: user?._id?.toString(),
          event: EVENT_TYPE_TRACK,
          eventMessage: 'Logged Out'
        });  
      }  
    }).catch((err) => logger.warning(`Analytics issue ${err?.message}, ${err?.stack}`), err);

  } catch(err) {
    res.status(RESPONSE_STATUS_ERROR).json(err);
    logger.warning(`Logout exception ${err?.message}, stack:${err?.stack}`, req);
  }

}

/**
 * Handles the registration of a user by email.
 * @param {object} req - The request object containing the user registration data.
 * @param {object} res - The response object used to send the registration response.
 */
const registerByEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(RESPONSE_STATUS_WRONG_PARAMS).json(errors);
      return;
    }

    const cookies = getCookies(req);
    const cookieId = cookies[COOKIE_NAME] || null;
    const referralCode = cookies?.referral || null;
    const { username, password } = req.body;

    const remoteAddressIp = requestIP.getClientIp(req) || req.connection.remoteAddress || null;

    const params = {
      username,
      password,
      remoteAddressIp,
      cookieId,
      referralCode
    };

    const register = await emailRegister(params);
    if (register) {
      res.status(RESPONSE_STATUS_OK).json(register);

      const user = await db.models.Users.findOne({ _id: register?.id }).exec();
      analytics({
        anonymousId: cookieId,
        userId: user?._id?.toString(),
        event: EVENT_TYPE_IDENTIFY,
        eventMessage: {
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
          message: 'Create account by email address'
        }
      });
    } else {
      const error = {
        msg: 'account exists, please login',
        param: '',
        location: ''
      };
      res.status(RESPONSE_STATUS_CONFLICT_REQUEST).json(error);
      return;
    }
  } catch (err) {
    logger.warning(`Issue when registering user by email: ${err?.message}`, req, err);
    const error = {
      msg: 'try-catch, something went wrong',
      param: '',
      location: ''
    };
    res.status(RESPONSE_STATUS_BAD_REQUEST).json(error);
  }
};

const loginByFacebook = async (req, res) => {
  try {
    if(req.user.id === null) {
      res.redirect('/login');  
    };
    const token = jwt.sign(req.user, process.env.JWT_SECRET, { expiresIn: `${TOKEN_TIMEOUT}h` });
    const Bearer = `Bearer ${token}`;
    res.setHeader('Authorization', Bearer)
    saveInfoInToBrowser(res, req.user, token);
    res.redirect('/affiliate-dashboard');
    const cookies = getCookies(req);
    const cookieId = cookies[COOKIE_NAME] || null;
    analytics({
      anonymousId: cookieId,      
      userId: req?.user?.id,
      event: EVENT_TYPE_TRACK,
      eventMessage: 'Logged In by facebook'
    });
  } catch(err) {
    logger.error(`login facebook issue ${err?.message}`, req, err);
  }
};

const loginByGoogle = async (req, res) => {
  try {
    const token = jwt.sign(req.user, process.env.JWT_SECRET, { expiresIn: `${TOKEN_TIMEOUT}h` });
    const Bearer = `Bearer ${token}`;
    res.setHeader('Authorization', Bearer)
    saveInfoInToBrowser(res, req.user, token);
    res.redirect('/affiliate-dashboard');
    const cookies = getCookies(req);
    const cookieId = cookies[COOKIE_NAME] || null;    
    analytics({
      anonymousId: cookieId,      
      userId: req?.user?.id,
      event: EVENT_TYPE_TRACK,
      eventMessage: 'Logged In by google'
    });
  } catch(err) {
    logger.warning(`login google issue ${err?.message}`, req, err);
  }
};

const loginByEmailWww = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.redirect(`/login-email?errors=${JSON.stringify(errors.array())}`);
      return;
    };

    const requestip = requestIP.getClientIp(req);

    const remoteAddressIp = requestip || req?.connection?.remoteAddress || null;
    const user = await emailLogin({username: req.body.username, password: req.body.password, lastIp: remoteAddressIp });

    if(!user.id) {
      const expires = moment().subtract(1,'hour').toDate();
      res.cookie('token', null, {expires});
      const error = {
        "msg": "wrong username or password",
        "param": "",
        "location": ""
      };
      res.redirect(`/login-email?errors=${JSON.stringify([error])}`);
    } else {
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: `${TOKEN_TIMEOUT}h` });
      const Bearer = `Bearer ${token}`;
      res.setHeader('Authorization', Bearer);
      saveInfoInToBrowser(res, user, token);
      const cookies = getCookies(req);
      const cookieId = cookies[COOKIE_NAME] || null;  
      res.redirect('/affiliate-dashboard');
      analytics({
        anonymousId: cookieId,        
        userId: user?.id,
        event: EVENT_TYPE_TRACK,
        eventMessage: 'Logged In by email on webpage'
      });  
    }
  } catch(err) {
    logger.warning(`login by email from website ${err?.message}`, req, err);
  }
};

const loginByEmailExtension = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
      return;
    }

    const requestip = requestIP.getClientIp(req);
    
    const remoteAddressIp = requestip || req?.connection?.remoteAddress || null;
    
    const user = await emailLogin({username: req.body.username, password: req.body.password, lastIp: remoteAddressIp });
    if(!user.id) {
      const expires = moment().subtract(1,'hour').toDate();
      res.cookie('token', null, {expires});
      const error = {
        "msg": "wrong username or password",
        "param": "",
        "location": ""
      };
      // eslint-disable-next-line consistent-return
      return res.status(RESPONSE_STATUS_BAD_REQUEST).json(error);
    };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: `${TOKEN_TIMEOUT}h` });
    const Bearer = `Bearer ${token}`;
    res.setHeader('Authorization', Bearer);
    saveInfoInToBrowser(res, user, token);
    res.status(RESPONSE_STATUS_OK).json({ token });
    const cookies = getCookies(req);
    const cookieId = cookies[COOKIE_NAME] || null;
    analytics({
      anonymousId: cookieId,       
      userId: user?.id,
      event: EVENT_TYPE_TRACK,
      eventMessage: 'Logged In by email on extension'
    });
  } catch(err) {
    logger.error(`issue when login by extension ${err?.message}`, req, err);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(RESPONSE_STATUS_WRONG_PARAMS).json(errors);
    };
    
    const enviroment = process.env?.ENV || null;
    let host = null;
    switch(enviroment) {
      case PRODUCTION : host = DOMAIN_TEST_PRODUCTION; break;
      case DEVELOPMENT : host = DOMAIN_TEST_DEVELOPMENT; break;
      case STAGING : host = DOMAIN_TEST_STAGING; break;
      case TEST : host = DOMAIN_TEST_STAGING; break;
      default : host = DOMAIN_TEST_PRODUCTION;
    }
    
    const {email} = req.query;
    const user = await db.models.Users.findOne({email}, {_id:1}).exec();
    if(!user) {
      return res.status(404).json('user not exists');
    }
    // cleanup
    await db.models.Mails.deleteMany({ createdAt: { $lt: new Date(Date.now() - 72 * 60 * 60 * 1000) }});
    // send email with instruction and token
    const resetPasswordToken = jwt.sign(user._doc, process.env.JWT_SECRET, { expiresIn: '72h' });
    const msgHash = {...user};
    const hash = Buffer.from( JSON.stringify(msgHash)).toString('base64');

    const emailData = {
      sendEmailTo: email,
      sendTemplateId: 2,
      messageData: {
        passwordResetURL: `${host}/reset-password?resetPasswordToken=${resetPasswordToken}&sign=${hash}`
      },
      subject: 'Password reset', 
      body: undefined
    };

    const MESSAGE_TYPE_PASSWORD_RESET = 'password-reset';

    return db.models.Mails
      .findOne({messageSign: hash, messageType: MESSAGE_TYPE_PASSWORD_RESET, used: false})
      .exec()
      .then(async(messageExists) => {
        if(!messageExists) {
          const sentEmail = await mailSend(emailData);

          if(sentEmail?.delivery_id !== '') {
            await changePassword(Math.random().toString(36).substring(2), new ObjectId(user?._id));
            db.models.Mails.insertMany({messageSign: hash, messageType: MESSAGE_TYPE_PASSWORD_RESET});
            return res.status(RESPONSE_STATUS_OK).json(resetPasswordToken);
          }

          return res.status(RESPONSE_STATUS_WRONG_PARAMS).json(sentEmail?.body);
        };
        return res.status(RESPONSE_STATUS_CONFLICT_REQUEST).json();
      });
  } catch(err) {
    logger.warning(`Forgot password with message: ${err?.message}`, req, err);
    return res.status(RESPONSE_STATUS_ERROR).json(err);
  };
};

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(RESPONSE_STATUS_WRONG_PARAMS).json(errors);
    };
  
    const {resetPasswordToken, password, sign} = req.query;
    const token = jwt.decode(resetPasswordToken, process.env.JWT_SECRET);
    const currentTime = Date.now() / 1000;
    if (token.exp < currentTime) {
      return res.status(RESPONSE_STATUS_NO_FOUND).json({errors:['token expired']});
    };
    const exists = await db.models.Mails.findOne({messageSign:sign}).exec();
    if(exists) {
      // db.models.Mails.updateMany({messageSign:sign},{used:true}).exec();
      const result = await changePassword(password, new ObjectId(token?._id));
      if(result) {
        db.models.Mails.deleteOne({messageSign:sign}).exec();
        return res.status(RESPONSE_STATUS_OK).json({status:'ok'});
      }
      return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({errors:['params wrong']});
    }
    return res.status(RESPONSE_STATUS_NO_FOUND).json({errors:['token no found or expired']});  
  } catch(err) {
    logger.warning(`Reset password issue with message: ${err?.message}`, req, err);
    return res.status(RESPONSE_STATUS_ERROR).json(err);
  };

};
 
module.exports = { 
  logout, 
  loginByEmailWww, 
  loginByGoogle,
  loginByFacebook,
  registerByEmail,
  loginByEmailExtension,
  forgotPassword,
  resetPassword
};
