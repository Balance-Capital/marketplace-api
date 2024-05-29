const { validationResult } = require('express-validator');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS
} = require('../constants/httpResponse');

const regions = require('../constants/regions')
const db = require('../models/index');


const getStoresRegions = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };

  const us = await db.models.Stores.find({
    'offers.countryCode' : { $in: regions.US}
  }).count().exec();

  const uk = await db.models.Stores.find({
    'offers.countryCode' : { $in: regions.UK},
    'offers.isActive': true
  }).count().exec();

  const eu = await db.models.Stores.find({
    'offers.countryCode' : { $in: regions.EU},
    'offers.isActive': true
  }).count().exec();

  const aus = await db.models.Stores.find({
    'offers.countryCode' : { $in: regions.AUS},
    'offers.isActive': true
  }).count().exec();

  const sa = await db.models.Stores.find({
    'offers.countryCode' : { $in: regions.SA},
    'offers.isActive': true
  }).count().exec();

  const response = {
    US: us, 
    UK: uk,
    EU: eu,
    AUS: aus,
    SA: sa
  }; 

  res.status(RESPONSE_STATUS_OK).json(response);
};

module.exports = { getStoresRegions };
