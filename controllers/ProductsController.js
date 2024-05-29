/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const { validationResult } = require('express-validator');
const { ObjectId } = require('bson');

const { QUERY_OFFSET, QUERY_LIMIT } = require('../constants/query');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_NO_FOUND,
  RESPONSE_STATUS_NO_FOUND,
  RESPONSE_STATUS_WRONG_PARAMS,
  RESPONSE_STATUS_ERROR
} = require('../constants/httpResponse');

const {
  PRODUCT_ID,
  PRODUCT_SEARCH
} = require('../constants/cacheKeyNames');

const {
  COMMISSION_JUNCTION
} = require('../constants/partnersName');

const db = require('../models/index');
const productsResponse = require('../response/ProductsResponse');
const logger = require('../services/logger');
const i18n = require('../services/i18n');
const { getCache } = require('../utils/getCache');
require('../services/cacheRedis');

const getAll = ({ limitQuery, offsetQuery, sessionId }, response) => {
  db.models.Products.find({
    'advertiserCountry': 'US',
    'partnerSource': COMMISSION_JUNCTION,
    'checked.status': 200,
    'image': {$not: new RegExp("default", "gui")}
  }).skip(offsetQuery).limit(limitQuery)
    .then( async (result) => {
      if (result && result.length === 0) {
        response.status(RESPONSE_STATUS_NO_FOUND).json(RESPONSE_NO_FOUND);
        return;
      }

      const results = await productsResponse({
        items: result,
        sessionId
      });
      
      response.status(RESPONSE_STATUS_OK).json(
        results
      );

    })
    .catch((err) => {
      logger.error(`Get all products: ${err}`);
      response.status(RESPONSE_STATUS_ERROR).json(err);
    });
};

const matchByCompanyName = (companyName, sessionId) => {
  try {
    const offsetQuery = 0;
    const limitQuery = 10;
    const advertiserName = new RegExp(`.*${companyName}.*`,'gui');
    const serachResult = db.models.Products.find({
      'advertiserName': advertiserName,
      'partnerSource': COMMISSION_JUNCTION,
      'checked.httpStatus': 200,
    }).skip(offsetQuery).limit(limitQuery).sort({createdAt:-1});

    return getCache(serachResult, db.models.RedisCacheKeys, PRODUCT_SEARCH)
      .then(async (result) => {
        const res = await productsResponse({
          items: result,
          sessionId
        });
        return res;
      })
      .catch((err) => {
        logger.error(`search products: ${err}`);
        return [];
      })
  } catch(error) {
    logger.warning(`[ProductController] matchByCompanyName ${error?.message}`, error);
    return [];
  }
}

/**
 * Searches for products in a database based on search criteria.
 * @param {Object} options - The search options.
 * @param {Array} options.searchText - An array of search terms.
 * @param {number} options.limitQuery - The maximum number of products to retrieve.
 * @param {number} options.offsetQuery - The number of products to skip before retrieving.
 * @param {string} options.sessionId - The session ID of the user.
 * @param {Array} options.categories - An array of categories to filter the products by.
 * @returns {Promise<Array>} - A promise that resolves to an array of objects representing the matching products.
 */
const searchProducts = async ({ searchText, limitQuery, offsetQuery, sessionId, categories }) => {
  try {
    const findText = searchText
      ?.filter(item => item && !item?.match(/&/gui))
      ?.flatMap(item => item?.split(' '))
      ?.map(i => ({ description: new RegExp(i, 'gui') })) || [];

    const matchCategories = categories
      ?.filter(item => item)
      ?.map(item => ({ categories: new RegExp(item, 'gui') })) || [];

    const query = (matchCategories.length === 0 && findText.length === 0) 
      ? {
          advertiserCountry: 'US',
          partnerSource: COMMISSION_JUNCTION,
          'checked.httpStatus': 200,
        }
      : {
          $or: [...findText, ...matchCategories],
          advertiserCountry: 'US',
          partnerSource: COMMISSION_JUNCTION,
          'checked.httpStatus': 200,
        }
    ;

    const searchResult = db.models.Products.find(query)
      .skip(offsetQuery)
      .limit(limitQuery)
      .sort({ createdAt: -1 });

    const result = await getCache(searchResult, db.models.RedisCacheKeys, PRODUCT_SEARCH);
    const formattedResult = await productsResponse({ items: result, sessionId });
    return formattedResult;
  } catch (error) {
    logger.warning(`[ProductsController] searchProducts ${error?.message}`, error);
    return [];
  }
};

const getSearch =  async ({ serachText, limitQuery, offsetQuery, sessionId }, response) => {
  if(!serachText) {
    response.status(RESPONSE_STATUS_WRONG_PARAMS).json('wrong params');
    return;
  }

  const result = await searchProducts({ serachText, limitQuery, offsetQuery, sessionId });
  
  if (result && result.length === 0) {
    response.status(RESPONSE_STATUS_NO_FOUND).json(RESPONSE_NO_FOUND);
    return;
  };

  response.status(RESPONSE_STATUS_OK).json(result);
};

const getById = async ({ id, sessionId }, response) => {
  try {
    id = new ObjectId(id);
  } catch (err) {
    logger.error(err);
    response.status(RESPONSE_STATUS_WRONG_PARAMS).json(i18n.__('wrongId'));
    return;
  };

  const filterId = {
    '_id': id
  }; 

  const query = db.models.Products.find(filterId);
    getCache(query, db.models.RedisCacheKeys, PRODUCT_ID)
      .then(result => {

        if (result && result.length === 0) {
          response.status(RESPONSE_STATUS_NO_FOUND).json(RESPONSE_NO_FOUND);
          return;
        }

        response.status(RESPONSE_STATUS_OK).json(
          productsResponse({
            items: result,
            sessionId
          })
        );
      })
      .catch((err) => {
        logger.error(err);
        response.status(RESPONSE_STATUS_ERROR).json(err);
      });
};

const get = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    return;
  }

  const limitQuery = Number(req.query.limit) || QUERY_LIMIT;
  const offsetQuery = Number(req.query.offset) || QUERY_OFFSET;

  const { id, search, sessionId } = req.query;

  if (id) {
    getById({ id, limitQuery, offsetQuery, sessionId }, res);
  } else if(search) {
    getSearch({ serachText:search, limitQuery, offsetQuery, sessionId }, res)
  } else {
    getAll({ limitQuery, offsetQuery, sessionId }, res);
  }
};

module.exports = { get, getSearch, searchProducts, matchByCompanyName };
