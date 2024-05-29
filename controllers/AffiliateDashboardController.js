const { validationResult } = require('express-validator');
const { ObjectId } = require('bson');
const moment = require('moment');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS,
  RESPONSE_STATUS_ERROR
} = require('../constants/httpResponse');

const {
  TRANSACTION_STATUS_ACTIVE
} = require('../constants/salesReport');

const db = require('../models/index');
const AffiliateDashboardResponse = require('../response/AffiliateDashboardResponse');
const { getUserCommissionInfo } = require('../services/userFinanceApi');

const logger = require('../services/logger');

const pagination = {
  page: 1,
  limit: 15,
  pages: 1,
  total: 1,
  next: null,
  prev: null
}

const getDashboardInfo = async ( id, dateStart, page ) => {

    pagination.page = +page || pagination.page;
    
    const userInfo = await db.models.Users.findOne({ _id: new ObjectId(id) }).exec();
    
    const userCommissionReport = await getUserCommissionInfo(userInfo.cookieId[0]);

    pagination.total = userCommissionReport.length;
    pagination.pages = parseInt(Math.round(userCommissionReport.length / pagination.limit), 10);

    pagination.next = pagination.pages > 0 ? pagination.page + 1 : null;

    const availableBalance = userInfo.balance;
    const unpaid = userCommissionReport.filter((item) =>
      item.transactionDetails.paymentStatus === 'unpaid'
      &&
      item.transactionDetails.status === TRANSACTION_STATUS_ACTIVE
    ) || 0;
    const pendingCommission = unpaid.map((item) => item.transactionDetails.publisherAmount).reduce((sum, a) => sum + a, 0) || 0;
    const linkClicks = await db.models.ReferralsClick.find({ referral: userInfo.referralId}).count() || 0;
    const conversions = await db.models.Users.find({ referralCode: userInfo.referralId}).count() || 0;

    let activity = await Promise.all( userCommissionReport.map( async (item) => {
      const { name } = item.merchantDetails;
      let obj = null;
      if(!name) {
        obj = {
          // eslint-disable-next-line no-underscore-dangle
          ...item,
          merchantDetails: {
            ...item.merchantDetails,
            logo: null
          }
        }
      } else {
        const regExp = new RegExp(name,'gui')
        const logo = await db.models.Stores.findOne({name: regExp},{logo:1}).exec().then(record => record.logo || null).catch(() => null);
        obj = {
          // eslint-disable-next-line no-underscore-dangle
          ...item,
          merchantDetails: {
            ...item.merchantDetails,
            logo
          }
        }  
      };
      return obj;
    }));
    
    const currency =
      activity?.length > 0
        ? activity[0]?.transactionDetails?.currency
        : '$';

    if(dateStart) {
      activity = activity.filter(item => 
        moment(item?.transactionDetails?.transactionDate).isAfter(moment(dateStart).toDate())
        && 
        moment(item?.transactionDetails?.transactionDate).isBefore(moment(dateStart).endOf('month').toDate())
      );
    }

    if(page) {
      const offset = page > 1 ? pagination.limit * page-1 : 0;
      const limit = page > 1 ? pagination.limit * page : pagination.limit;
      activity = activity.slice(offset, limit);
    }
    
    return {
      userName: `${userInfo.firstName || ''}`,
      availableBalance,
      pendingCommission,
      linkClicks,
      conversions,
      activity,
      pagination,
      currency
    };
};

const get = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    };

    const userId = req?.user?.id || null;
    if(!userId) {
      return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    };

    const { page } = req.query;
    const dateStart = moment(req.query.dateStart) || moment();
    const response = await getDashboardInfo(userId, dateStart, page);

    return res.status(RESPONSE_STATUS_OK).json(AffiliateDashboardResponse(response));
  } catch (error) {
    logger.error(`[AffiliateDashboardController] ${error?.message}`, error, req);
    return res.status(RESPONSE_STATUS_ERROR).json([]);
  }
}

module.exports = { get };