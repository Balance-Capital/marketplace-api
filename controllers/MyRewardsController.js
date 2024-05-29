const { validationResult } = require('express-validator');
const moment = require('moment');
const { ObjectId } = require('bson');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS,
  RESPONSE_STATUS_ERROR
} = require('../constants/httpResponse');

const {
  TRANSACTION_FORMAT
} = require('../constants/dateTime');

const {
  PAYMENT_STATUS_UNPAID,
  PAYMENT_STATUS_PAID
} = require('../constants/salesReport');

const {
  REFERRALS_STATUS_DONE,
  REFERRALS_STATUS_PENDING
} = require('../constants/referralsStatus');

const {
  TRANSACTION_STATUS_DONE,
  WITHDRAW_STATUS_OFF
} = require('../constants/salesReport');

// const { QUERY_LIMIT } = require('../constants/query');

const db = require('../models/index');
const logger = require('../services/logger');
const myRewardsResponse = require('../response/MyRewardsResponse');
const { getUserCommissionInfo } = require('../services/userFinanceApi');

const getAll = async (req, res) => {
  try {
    const userId = req?.user?.id || null;
    if(!userId) {
      res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: [`wrong token or missing ${userId}`] });
      return;
    };

    const trackersId = await db.models.Users.findOne({_id: new ObjectId(userId)}, { cookieId:1, referralId:1 });

    let transactions = await db.models.Users
      .findOne({_id: new ObjectId(userId)}, { balanceHistory:1 })
      .exec()
      .then(item => item.balanceHistory);

    transactions = transactions.map((item) => ({
        type: item.operationType,
        amount: item.operationAmount || 0,
        date: moment(item.operationDate).format(TRANSACTION_FORMAT),
        symbol: item.operationSymbol,
        // eslint-disable-next-line no-underscore-dangle
        transactionID: item._id,
        status: TRANSACTION_STATUS_DONE
      })
    );

    const myRewards = await getUserCommissionInfo(trackersId.cookieId[0]);

    const referralId = trackersId?.referralId || null;
    let referralSumRewardsDone = 0;
    let referralSumRewardsPending = 0;
    
    if(referralId) {
      const myReferralRewards = await db.models.Referrals.find({referral:referralId}).exec();

      referralSumRewardsDone = myReferralRewards      
      .filter(item => item.status === REFERRALS_STATUS_DONE)
      .map(item => item.refBonus)
      .reduce((previousValue, currentValue) => previousValue + currentValue, 0)
      || 0
      ;

      referralSumRewardsPending = myReferralRewards      
      .filter(item => item.status === REFERRALS_STATUS_PENDING)
      .map(item => item.refBonus)
      .reduce((previousValue, currentValue) => previousValue + currentValue, 0)
      || 0
      ;

    }

    const totalEarnings = referralSumRewardsDone + myRewards
      .filter(item => item.transactionDetails.paymentStatus === PAYMENT_STATUS_PAID && item.transactionDetails.withDrawStatus === WITHDRAW_STATUS_OFF)
      .map(item => item.transactionDetails.publisherAmount)
      .reduce((previousValue, currentValue) => previousValue + currentValue, 0)
      || 0
      ;

    const pendingEarnings = referralSumRewardsPending + myRewards
      .filter(item => item.transactionDetails.paymentStatus === PAYMENT_STATUS_UNPAID)
      .map(item => item.transactionDetails.publisherAmount)
      .reduce((previousValue, currentValue) => previousValue + currentValue, 0)
      || 0
      ;
      
    const availableEarnings = referralSumRewardsDone + myRewards
      .filter(item => item.transactionDetails.paymentStatus === PAYMENT_STATUS_PAID && item.transactionDetails.withDrawStatus === WITHDRAW_STATUS_OFF)
      .map(item => item.transactionDetails.publisherAmount)
      .reduce((previousValue, currentValue) => previousValue + currentValue, 0)
      || 0
      ;

    const currency = myRewards?.length > 0
        ? myRewards[0]?.transactionDetails?.currency
        : '$';
  
    const response = {
      totalEarnings,
      pendingEarnings,
      availableEarnings,
      transactions,
      currency
    };

    res.status(RESPONSE_STATUS_OK).json(
      myRewardsResponse(response)
    ); 

  } catch(error) {
    logger.error(`[MyRewardsController] get my rewards: ${error?.message}`, req, res, error);
    res.status(RESPONSE_STATUS_ERROR).json(error);
  };

};

const get = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };

  getAll(req, res);

};

module.exports = { get };
