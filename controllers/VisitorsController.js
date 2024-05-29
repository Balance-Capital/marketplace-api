const { validationResult } = require('express-validator');
const cookie = require('cookie');
const crypto = require('crypto');
const moment = require('moment');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS
} = require('../constants/httpResponse');

const db = require('../models/index');

const get = async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };

  const cookies = cookie.parse(req.headers.cookie || ''); 
  let { visitorId } = cookies;

  if(!visitorId) {
    visitorId = crypto.createHash("sha256")
    .update(moment().toNow())
    .digest("hex");    
  
    res.setHeader('Set-Cookie', cookie.serialize('visitorId', String(visitorId), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365
    }));  
  }

  const visitors = await db.models.Visitors.findOne(
    {cookieId: visitorId}
  ).exec();
  if(!visitors) {
    db.models.Visitors.create({
      cookieId: visitorId,
      lastIp:req.connection.remoteAddress,
      lastReferer: req.headers.referer
    });
  } else {
    db.models.Visitors.updateOne(
      {cookieId: visitorId},
      {
        lastIp:req.connection.remoteAddress,
        lastReferer: req.headers.referer
    });
  }

  res.status(RESPONSE_STATUS_OK).json({visitorId});
}

module.exports = { get };