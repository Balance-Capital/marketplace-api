const { validationResult } = require('express-validator');
// const moment = require('moment');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS,
  RESPONSE_STATUS_ERROR
} = require('../constants/httpResponse');

// const { QUERY_LIMIT } = require('../constants/query');

const db = require('../models/index');
const logger = require('../services/logger');
const dashBoardResponse = require('../response/DashBoardResponse');

const getAll = async (response) => {
  try {
    const dashBoard = await db.models.DashBoard.find({}).exec();
    
    const importedOffersReport = [];
    // await db.models.OffersReport.find({ 
    //     createdAt: {
    //         $gte: moment().subtract(1,'day').startOf('day'),
    //         $lte: moment().endOf('day')
    //     }
    // }).sort({updatedAt:-1}).limit(QUERY_LIMIT).exec();

    response.status(RESPONSE_STATUS_OK).json(
      dashBoardResponse({ dashboard: dashBoard, imported: importedOffersReport })
    ); 

  } catch(error) {
    logger.error(`get dashboard: ${error}`);
    response.status(RESPONSE_STATUS_ERROR).json(error);
  };

};

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

  getAll(res);

};

module.exports = { get };
