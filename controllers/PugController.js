/* eslint-disable no-underscore-dangle */
require('dotenv').config();
const { ObjectId } = require('bson');
const { validationResult } = require('express-validator');
const moment = require('moment');

const ACCESS_TOKEN = process.env.API_ACCESS_TOKEN || null;

const db = require('../models/index');

const {
  DEVELOPMENT,
  STAGING,
  DOMAIN_TEST_DEVELOPMENT,
  DOMAIN_TEST_STAGING,
  DOMAIN_TEST_PRODUCTION
} = require('../constants/enviroment');

let DOMAIN;
switch(process.env.APP_ENV) {
  case DEVELOPMENT : DOMAIN = DOMAIN_TEST_DEVELOPMENT; break;
  case STAGING : DOMAIN = DOMAIN_TEST_STAGING; break;
  default: DOMAIN = DOMAIN_TEST_PRODUCTION;
};

const getData = () => db.models.Stores.findOne({
    indexing: false,
    'seo.dateManualCheck': null,
    'seo.jarvisContentUpdatedAt': {$ne: null}
  },{_id:1, name:1, domain:1, seo:1, description:1}).then((store)=>{
      if(!store) return {};
      return { 
      token: ACCESS_TOKEN, 
      companyName: store.name,
      description: store.description || null,
      storeId: store._id,
      domain: `${DOMAIN}/coupons/${store.domain}`,
      contentLength: store.seo.contentLength || 0
      };
    });

const get = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  };
  
  getData().then( (params) => res.status(200).render('descriptionForm', params) );
}

const post = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  };

  const indexing = req.body.indexing === 'on';
  const description = req.body.description || null;
  db.models.Stores.updateOne({
    _id: new ObjectId(req.body.storeId)
  },{indexing, description, 'seo.dateManualCheck': moment().toDate()}).then(()=>{
    getData().then( (params) => res.status(200).render('descriptionForm', params) );  
  });
}

module.exports = { get, post }
