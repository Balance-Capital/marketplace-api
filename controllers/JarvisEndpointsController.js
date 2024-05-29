/* eslint-disable no-underscore-dangle */
const { validationResult } = require('express-validator');
const moment = require('moment');
const { ObjectId } = require('bson');
const axios = require('axios');

const MODULE_NAME = 'JarvisEndpointsController';

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS
} = require('../constants/httpResponse');

const TIMEOUT_CONNECTION = 5000;
const TIMEOUT_RESPONSE = 10000;

const { jarvisFilter } = require('../utils/jarvisFilter');

const logger = require('../services/logger');

const jarvisEndpointsResponse = require('../response/JarvisEndpointsResponse');

const {cleanString} = require('../utils/unicode');

const db = require('../models/index');

const pickUpText = (domain) => {
  try { 
    const {CancelToken} = axios;
    const source = CancelToken.source();
    setTimeout(() => {
      source.cancel('Operation canceled by the user.');
    },TIMEOUT_RESPONSE);
    return axios({
      url:`http://${domain}`, 
      method:'get', 
      timeout:TIMEOUT_CONNECTION,
      cancelToken: source.token
    }).then((result) => {
      if(result && result.data) {
        const description =  result.data.match(/<.*meta.*name=.?description.? content=.?(.[^</>]*).*>/)
        return description && description[1].replace(/"*|'*/gui,'') || null;
      };
      return null;
    }).catch((err) => { 
      logger.error(`${MODULE_NAME} pickUpText: ${err}`); 
      return null; 
    });
  }catch(err) {
    logger.error(`${MODULE_NAME} exception pickUpText: ${err}`); 
    return null;
  };
};

const getData = () => db.models.Stores.findOne({
    description: {$eq: null},
    domain: {$ne: null},
    'seo.contentUpdatedAt': null
  },{name:1,domain:1,_id:1})
    .sort({name:1})
    .exec()
    .then((stores) => stores)
    .catch((err)=>logger.error(`${MODULE_NAME} getData: ${err}`));

const getJarvisData = () => db.models.Stores.findOne({
      domain: {$ne: null},
      'seo.jarvisContentUpdatedAt': null,
      'seo.contentLength': {$gt: 0},
      publicIndexing: {$ne: null}
    },{name:1,domain:1,_id:1,description:1})
      .sort({name:1})
      .exec()
      .then((stores) => stores)
      .catch((err)=>logger.error(`${MODULE_NAME} getJarvisData: ${err}`));
  
const updateData = ({id,description}) => db.models.Stores.updateOne(
  {_id: new ObjectId(id)},
  {
    description,
    'seo.contentUpdatedAt': moment().toDate(),
    'seo.contentLength': description.length
  })
  .exec()
  .catch((err)=>logger.error(`${MODULE_NAME} updateData: ${err}`));

const jarvisUpdateData = ({id,description}) => db.models.Stores.updateOne(
    {_id: new ObjectId(id)},
    {
      description,
      'seo.contentLength': description.length,
      'seo.jarvisContentUpdatedAt': moment().toDate()
    })
    .exec()
    .catch((err)=>logger.error(`${MODULE_NAME} jarvisUpdateData: ${err}`));

const decodeEntities = (encodedString) => {
  const translateRe = /&(nbsp|amp|quot|lt|gt);/g;
  const translate = {
    "nbsp":" ",
    "amp" : "&",
    "quot": "\"",
    "lt"  : "<",
    "gt"  : ">"
  };
  return encodedString.replace(translateRe, (match, entity) => translate[entity]).replace(/&#(\d+);/gi, (match, numStr) => {
    const num = parseInt(numStr, 10);
    return String.fromCharCode(num);
  });
};

const prepareResponse = async () => {
  const data = (await getData());
  if(!data) return {};

  const descriptionFromWebsite = (await pickUpText(data.domain));

  if(descriptionFromWebsite === null || typeof descriptionFromWebsite === 'object' ) {
    db.models.Stores.updateOne({_id:data.id},{'seo.contentUpdatedAt': moment().toDate()}).exec();
    return prepareResponse();
  };

  const cleanDescription = decodeEntities( cleanString([...descriptionFromWebsite]) );
  const checkJarvisFilter = jarvisFilter(cleanDescription);

  if(!cleanDescription || checkJarvisFilter) {
    db.models.Stores.updateOne({_id:data.id},{'seo.contentUpdatedAt': moment().toDate()}).exec();
    return prepareResponse();
  };

  updateData({id: data.id, description: cleanDescription})

  return {...data._doc, companyInformation:cleanDescription};
};

const jarvisPrepareResponse = async () => {
  const data = (await getJarvisData());
  if(!data) return {};
  return {...data._doc, name: decodeEntities( cleanString([...data.name])), companyInformation: data.description};
};

const getSeoDescription = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };
  const data = (await prepareResponse());
  res.status(RESPONSE_STATUS_OK).json(await jarvisEndpointsResponse({items:[data]}))
};

const getJarvis = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };
  const data = (await jarvisPrepareResponse());
  res.status(RESPONSE_STATUS_OK).json(await jarvisEndpointsResponse({items:[data]}))
};

const update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };
  try {
    jarvisUpdateData({id: req.body.id, description: req.body.article})
    .then((result) => {
      res.status(RESPONSE_STATUS_OK).json(result);
    }).catch((err)=> {
      res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: err });
    });  
  } catch(err) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: err });
  };
};

const generateDescriptionCheckListOfStores = () => db.models.Stores.find({
  indexing: false,
  domain: {$ne: null},
  'seo.jarvisContentUpdatedAt': {$ne: null},
  'seo.contentLength': {$gt: 0}
  })
  .exec()
  .then((stores) => {
    const records = stores.map((item)=>`"${item.name}","${item._id}"`);
    let csv = '"Name","Id"\n';
    csv += records.join('\n');
    return csv;
  })
  .catch((err)=>logger.error(`${MODULE_NAME} generateDescriptionCheckListOfStores: ${err}`));

const getListOfStores = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  };

  const list = (await generateDescriptionCheckListOfStores());

  res.status(RESPONSE_STATUS_OK);
  res.setHeader('Content-Length', list.length);
  res.setHeader('Content-Type', 'text/csv');
  res.write(list, 'binary');
  res.end();
};

module.exports = { 
  getJarvis, 
  getSeoDescription, 
  update, 
  pickUpText, 
  getData, 
  prepareResponse, 
  jarvisPrepareResponse,
  generateDescriptionCheckListOfStores,
  getListOfStores
};