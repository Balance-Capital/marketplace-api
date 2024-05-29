const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { validationResult } = require('express-validator');
const moment = require('moment');
const { ObjectId } = require('bson');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS,
  RESPONSE_STATUS_ERROR,
  RESPONSE_STATUS_NO_FOUND,
  RESPONSE_STATUS_BAD_REQUEST
} = require('../constants/httpResponse');

const {
  REFERRALS_STATUS_DONE,
  REFERRALS_STATUS_PENDING
} = require('../constants/referralsStatus');

const logger = require('../services/logger');
const db = require('../models/index');
const referralsResponse = require('../response/ReferralsResponse');

const { checkSignedByUser } = require('../utils/sign');
const referralsCommissionReportProof = require('../proofs/referralsCommissionReportProof');

const FINGERPRINT = process?.env?.FINGERPRINT || null;

const pagination = {
  page: 1,
  limit: 15,
  pages: 1,
  total: 1,
  next: null,
  prev: null
}

const setClick = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
      return;
    };
  
    const { referral, userAgent } = req?.query || null;
    const ip = req?.connection?.remoteAddress || null;
  
    const result = db.models.ReferralsClick.insertMany({
      referral,
      ip,
      userAgent
    });
    return result || false;
  } catch(err) {
    logger.warning(`Referrals click issue ${err?.messgae}`, req, err, res)
  }
}

const get = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };

  const userId = req?.user?.id || null;
  if(!userId) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: ['wrong  or missing token'] });
    return;
  };

  const { dateStart, page } = req.query;
  pagination.page = +page || 1;
  const offset = page > 1 ? ((pagination.page-1) * pagination.limit) : 0

  db.models.Users.findOne({_id: new ObjectId(userId)})
    .then((user) => {
      if(!user) {
        res.status(RESPONSE_STATUS_NO_FOUND).json([]);
        logger.warning(`[ReferralsController] Can't get user id ${userId}`, user, req, res);
        return;
      }
      const referral = user.referralId
      db.models.Referrals.find({
        referral
      })
      .skip(offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec()
      .catch((err) => {
        res.status(RESPONSE_STATUS_ERROR).json(err);
        logger.error(err);
      })
      .then(async (results) => {

        // eslint-disable-next-line no-restricted-syntax
        for(const result of results) {
          const signed = result?.signed?.filter((item) => item.name === 'intermediate');
          if(signed && signed?.length > 0) {
            const signedValue = signed[0]?.value;
            const proof = Object.create(referralsCommissionReportProof);
            proof.currency = result.currency;
            proof.refBonus = result.refBonus;
            proof.transactionId = result.transactionId;
            proof.createdAt = moment(result.date).toDate();
            // eslint-disable-next-line no-await-in-loop
            const checkedSignedByUser = await checkSignedByUser(proof, FINGERPRINT, signedValue);
            if(!checkedSignedByUser) {
              logger.warning(`[ReferralsController] check signed value`, signedValue, results);
              return res.status(RESPONSE_STATUS_BAD_REQUEST).json();
            }
          }
        }

        const pendingRewards = results && results
        ?.filter((item) => item.status === REFERRALS_STATUS_PENDING)
        ?.map((item) => item.refBonus)
        ?.reduce((a, b) => a + b, 0).toPrecision(4) || 0;

        const availableRewards = results && results
        ?.filter((item) => item.status === REFERRALS_STATUS_DONE)
        ?.map((item) => item.refBonus)
        ?.reduce((a, b) => a + b, 0).toPrecision(4) || 0;

        const usersJoined = await db.models.Users.find({ referralCode: user.referralId}).exec() || null;
        const joined = usersJoined.length || 0; // await db.models.Users.find({ referralCode: user.referralId}).count() || 0;
        const clicked = await db.models.ReferralsClick.find({ referral: user.referralId}).count() || 0;
        
        let data = [];
        if(results.length > 0 && dateStart) {
          data = results.filter((item) => moment(item.createdAt).isAfter(moment(dateStart).startOf('day')) && moment(item.createdAt).isBefore(moment(dateStart).add(1,'month').startOf('day')));
        };

        const response = {
          data,
          referral: user.referralId || null,
          clicked,
          joined,
          availableRewards,
          pendingRewards,
          usersJoined,
          pagination
        }
        return res.status(RESPONSE_STATUS_OK).json(referralsResponse(response));
      });    
    })
    .catch((err) => {
      res.status(RESPONSE_STATUS_ERROR).json(err);
      logger.error(`[ReferralsController] ${err?.message}`, req, err, res);
    })
}

module.exports = { get, setClick };