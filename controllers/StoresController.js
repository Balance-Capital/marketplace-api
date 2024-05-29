/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
const { validationResult } = require('express-validator');
const { ObjectId } = require('bson');

const { 
  QUERY_OFFSET, 
  QUERY_LIMIT,
  QUERY_LIMIT_FOR_STORE
} = require('../constants/query');

const { 
  DOMAIN_PRODUCTION 
} = require('../constants/domains');

const { COUPON } = require('../constants/offersType');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS,
  RESPONSE_STATUS_ERROR,
  RESPONSE_STATUS_BAD_REQUEST,
  RESPONSE_BAD_REQUEST,
  RESPONSE_STATUS_NO_FOUND,
  RESPONSE_NO_FOUND
} = require('../constants/httpResponse');

const REGEXP_START_FROM_NOT_ALPHA = '^[^a-zA-Z]';

const {
  CACHE_DEFAULT_EXPIRE
} = require('../constants/cacheDefaultExpire');

const {
  REDIS_CACHE_CONFIG, 
  STORE_ID
} = require('../constants/cacheKeyNames');

const {
  US
} = require('../constants/countriesSupport')

const regions = require('../constants/regions')

const {
  ucFirst
} = require('../utils/strings');

require('../services/cacheRedis');

const logger = require('../services/logger');
const db = require('../models/index');
const i18n = require('../services/i18n');

const storesResponse = require('../response/StoresResponse');
const storeSiteResponse = require('../response/StoreSiteResponse');
const searchResponse = require('../response/SearchResponse');
const searchExtResponse = require('../response/SearchExtResponse');

const { sortOfferDesc } = require('../utils/sort');
const { product } = require('../utils/json-ld');
const { offersScoreFunction } = require("../utils/offersScore");
const { searchProducts, matchByCompanyName } = require('./ProductsController');
const withProductsResponse = require('../response/withProductsResponse');

const prepeareCookies = require('../utils/prepeareCookies');

/**
 * Retrieves data from a database and returns a response.
 * @param {Object} options - The options for retrieving data.
 * @param {number} options.limitQuery - The maximum number of results to retrieve (default is 10).
 * @param {number} options.offsetQuery - The number of results to skip (default is 0).
 * @param {string[]} options.country - An array of country codes to filter the data by.
 * @param {string} options.sessionId - The session ID for the request.
 * @param {Object} request - The request object.
 * @param {Object} response - The response object.
 * @returns {Object} - The response object.
 */
const getAll = async ({ limitQuery = 10, offsetQuery = 0, country, sessionId }, request, response) => {
  const cookie = prepeareCookies(request);
  try {
    const shopsWithValidOffers = await db.models.Stores.filterByValidDate({
      firstMatch: { $match: { 'offers.countryCode': { $in: country } } },
      lastMatch: { $match: { offers: { $not: { $size: 0 } } } },
      limitQuery,
      offsetQuery,
      sort: { priority: 1 },
      countryCode: country[0]
    });

    const result = shopsWithValidOffers
      .map(a => ({
        ...a,
        epc: parseFloat(a.epc),
        averageCommissionRate: parseFloat(a.averageCommissionRate),
        averageBasketSize: parseFloat(a.averageBasketSize),
        averageConversionRate: parseFloat(a.averageConversionRate)
      }))
      .filter((a, index, arr) => arr.findIndex(b => b.domains[0] === a.domains[0]) === index)
      .slice(0, limitQuery);

    if (result.length === 0) {
      return response
        .cookie(cookie.name, cookie.value, cookie.date)
        .status(RESPONSE_STATUS_BAD_REQUEST)
        .json(RESPONSE_BAD_REQUEST);
    }

    const productSearch = ['Computer & Electronics', 'Entertainment', 'Toys', 'Gifts', 'Furniture', 'Vacation', 'Home & Garden', 'Travel', 'Home & Garden', 'Beauty'];
    const products = await searchProducts({ serachText: productSearch, limitQuery: 10, offsetQuery: 0, sessionId, categories: productSearch });

    return response
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_OK)
      .json(
        withProductsResponse(
          products.filter(item => item?.price?.amount > 0),
          storesResponse({
            items: result,
            sessionId,
            excludeOffers: false
          })
        )
      );

  } catch (error) {
    logger.warning(`[StoresController] getAll ${error?.message}`, error);
    return response
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_ERROR)
      .json(error);
  }
};

const getJsonLd = (store, offer) =>
  product({
    brand: store.name,
    name: `${COUPON}`,
    image: `${DOMAIN_PRODUCTION}${store.logo}`,
    description: store.description,
    rating: offer && offer.star || 5
});

const getById = async ({ id, sessionId }, request, response) => {
  const cookie = prepeareCookies(request);
  try {
    id = new ObjectId(id);
  } catch (err) {
    return response
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_WRONG_PARAMS).json(i18n.__('wrongId'));
  };

  const CACHE_EXPIRE = await db.models.RedisCacheKeys.findOne({name:REDIS_CACHE_CONFIG},{expire:1})
    .cache({key:REDIS_CACHE_CONFIG,expire:CACHE_DEFAULT_EXPIRE})
    .exec()
    .catch(error=>logger.error(error))
    .then(result => result.expire)|| CACHE_DEFAULT_EXPIRE;
  
  const cache = await db.models.RedisCacheKeys.find({name:STORE_ID})
    .cache({key:REDIS_CACHE_CONFIG,expire:CACHE_EXPIRE})
    .exec()
    .catch(error=>logger.error(error))
    ;

  const query = db.models.Stores.findById(id);
  if(cache && cache[0] && cache[0].active) 
    query
      .cache({key: cache[0].name, expire: cache[0].expire});
  query  
    .exec()
    .then(async (result) => {
      if (!result) {
        return response
          .cookie(cookie.name, cookie.value, cookie.date)
          .status(RESPONSE_STATUS_BAD_REQUEST)
          .json(RESPONSE_BAD_REQUEST);
      }

      const offers = result.offers.sort(sortOfferDesc);
      const availableOffers = offersScoreFunction(offers);
      const similarCoupons = await db.models.Stores.sideBarGetSimilarCoupons(result);
      const featureRetailer = await db.models.Stores.sideBarFeatureRetailer(result);
      const jsonLd = getJsonLd(result, offers[0]);

      return response
        .cookie(cookie.name, cookie.value, cookie.date)
        .status(RESPONSE_STATUS_OK)
        .json(
        storeSiteResponse({
          store: result,
          availableOffers,
          similarCoupons,
          featureRetailer,
          jsonLd,
          sessionId
        })
      );
    })
    .catch((err) => {
      logger.error(err);
      return response
        .cookie(cookie.name, cookie.value, cookie.date)
        .status(RESPONSE_STATUS_ERROR)
        .json(err);
    });
};

const getByAlphabet = async (
  { filter, offsetQuery, country, sessionId },
  request, response
) => {
  const limitQuery = -1;
  const cookie = prepeareCookies(request);
  
  if(filter !== '#' && filter.match(/^[A-Z]*$/)) {
    return response
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_NO_FOUND)
      .json(RESPONSE_NO_FOUND);
  };

  try {
    const re = filter === '#' 
    ? new RegExp(REGEXP_START_FROM_NOT_ALPHA)
    : new RegExp(`^${filter}|^${ucFirst(filter)}`);
    
    const validDate = await db.models.Stores.filterByValidDate({
      firstMatch: { $match: { name: { $regex: re } } },
      lastMatch:{ $match: { offers: { $not: {$size:0} } } },      
      limitQuery,
      offsetQuery,
      sort:{ priority: 1 },
      collation: { locale: 'en', strength: 2 },
      countryCode: country[0]
    });
      
    const result = [
      ...validDate
    ].reduce((a,b) => { 
      if(!a.filter(item => 
          item.domain === b.domain
        ).length) 
        a.push(b); 
        return a;
      },[]);
    
    if (result && result.length === 0) {
      return response
        .cookie(cookie.name, cookie.value, cookie.date)
        .status(RESPONSE_STATUS_BAD_REQUEST)
        .json(RESPONSE_BAD_REQUEST);
    };

    return response
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_OK)
      .json(storesResponse({ items: result, sessionId, excludeOffers:true }));

  } catch(error) {
    logger.error(error);
    return response
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_ERROR)
      .json(error);
  };

};

const getByDomain = async (
  { domain, offsetQuery, country, sessionId },
  request, response
) => {
  const cookie = prepeareCookies(request);
  const noStoreError = `no store: ${domain}`;
  try {
    const validOffers = await db.models.Stores.filterByValidDate({
      lastMatch:{ $match: { offers: { $not: {$size:0} } } },
      firstMatch: { 
        $match: { 
          $or : [
            { domain: { $regex: new RegExp(`^${domain}`) } },
            { domain: { $regex: new RegExp(`^${ucFirst(domain)}`) } }
          ]
        }
      },
      limitQuery: QUERY_LIMIT_FOR_STORE,
      offsetQuery,
      sort:{ priority: 1 },
      collation: { locale: 'en', strength: 2 },
      countryCode: country[0]
    });
  
    const store = validOffers[0];
    if(!store) {
      return response
        .cookie(cookie.name, cookie.value, cookie.date)
        .status(RESPONSE_STATUS_NO_FOUND)
        .json(noStoreError);
    };

    const vdo = validOffers[0] && validOffers[0].offers ? validOffers[0].offers : [];
    const allOffers = [...vdo].slice(0,QUERY_LIMIT_FOR_STORE);
    
    store.offers = [...allOffers];
    const result = store;
    
    if (result && result.length === 0 ) {
      return response
        .cookie(cookie.name, cookie.value, cookie.date)
        .status(RESPONSE_STATUS_BAD_REQUEST)
        .json(RESPONSE_BAD_REQUEST);
    };

    const offers = result && result.offers && result.offers.sort(sortOfferDesc) || [];
    const availableOffers = await db.models.Stores.offersScoreFunction(store._id, store.country);
    const similarCoupons = await db.models.Stores.sideBarGetSimilarCoupons(result);
    const featureRetailer = await db.models.Stores.sideBarFeatureRetailer(result);
    const jsonLd = getJsonLd(result, offers[0]);
     
    let products = await matchByCompanyName(result?.name, sessionId);
    if(!products.length) {
      const serachText = result && result.categories.filter(item => item).length > 0 && result.categories.filter(item => item) || ['Technology'];
      products = await searchProducts({ serachText, limitQuery:10, offsetQuery:0, sessionId, categories: result?.categories });  
    }

    return response
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_OK)
      .json(
      withProductsResponse( products, 
      storeSiteResponse({
        store: result,
        availableOffers,
        similarCoupons,
        featureRetailer,
        jsonLd,
        sessionId
      })));
      
  } catch(error) {
    logger.error(error);
    return response
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_BAD_REQUEST)
      .json(error);
  };
};

/**
 * Handles a search request.
 * @param {object} req - The request object containing the search parameters.
 * @param {object} res - The response object used to send the search results or error message.
 * @returns {Promise} - A promise that resolves with a JSON response.
 */
const search = async (req, res) => {
  const cookie = prepeareCookies(req);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Send validation errors as JSON response
    return res
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_WRONG_PARAMS)
      .json({ errors: errors.array() });
  }

  const worldRegion = req.query.country || 'US';
  const region = Object.keys(regions).find(item => item === worldRegion);
  const country = regions[region];

  const { querySearch } = req.params;
  const regex = new RegExp(`.*(${querySearch.split(' ').join('|')}).*`, 'gui');

  try {
    const result = await db.models.Stores.searchBar({
      lastMatch: { $match: { offers: { $not: { $size: 0 } } } },
      firstMatch: {
        $match: {
          $or: [
            { 'name': { $regex: regex } },
            { 'domain': { $regex: regex } }
          ]
        }
      },
      limitQuery: QUERY_LIMIT,
      offsetQuery: 0,
      sort: { priority: 1 },
      countryCode: country[0]
    });

    // Remove duplicate domains from the search results
    const uniqueResults = result.reduce((a, b) => {
      if (!a.some(item => item.domain === b.domain)) {
        a.push(b);
      }
      return a;
    }, []);

    // Send search results as JSON response
    return res
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_OK)
      .json(searchResponse({ search: uniqueResults }));
  } catch (err) {
    // Log and send error message as JSON response
    logger.warning(`[StoresController] search ${err?.message}`, err);
    return res
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_ERROR)
      .json(err);
  }
};

/**
 * Performs a search operation based on the provided query parameters.
 * @param {object} req - The request object containing the query parameters and other data.
 * @param {object} res - The response object used to send the search results back to the client.
 * @returns {Promise} - A promise that resolves to a JSON response containing the search results or an error message.
 */
const searchExt = async (req, res) => {
  const cookie = prepeareCookies(req);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_WRONG_PARAMS)
      .json({ errors: errors.array() });
  }

  const worldRegion = req.query.country || 'US';
  const region = Object.keys(regions).find(item => item === worldRegion);
  const country = regions[region];

  const { querySearch } = req.params;
  const regex = querySearch.length === 1
    ? new RegExp(`^${querySearch}`, 'gui')
    : new RegExp(`.*${querySearch.split(' ').join('|')}.*`, 'gui');

  const sessionId = req.query.sessionId || null;

  try {
    const result = await db.models.Stores.searchBar({
      lastMatch: { $match: { offers: { $not: { $size: 0 } } } },
      firstMatch: {
        $match: {
          offers: { $ne: [] },
          'offers.countryCode': { $in: country },
          $or: [
            { 'name': { $regex: regex } },
            // { 'offers.origin':  { $regex: regex } },
            // { 'offers.description':  { $regex: regex } },
            // { 'offers.title':  { $regex: regex } }
          ]
        }
      },
      limitQuery: QUERY_LIMIT,
      offsetQuery: 0,
      sort: { priority: 1 },
      countryCode: country[0]
    });

    const filteredResult = result.reduce((a, b) => {
      if (!a.some(item => item.domain === b.domain)) {
        a.push(b);
      }
      return a;
    }, []);

    return res.cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_OK)
      .json(searchExtResponse({ items: filteredResult, sessionId }));
  } catch (err) {
    logger.warning(`[StoresController] searchExt ${err?.message}`, err);
    return res
      .cookie(cookie.name, cookie.value, cookie.date)
      .status(RESPONSE_STATUS_ERROR)
      .json(err);
  }
};

/**
 * Retrieves data based on the provided parameters.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {boolean} - Returns true.
 */
const get = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
  };

  const limitQuery = Number(req.query.limit) || QUERY_LIMIT;
  const offsetQuery = Number(req.query.offset) || QUERY_OFFSET;

  const id = req.query.id || null;
  const filter = req.query.filter || null;
  const domain = req.params.domain || null;
  const sessionId = req.query.sessionId || null;
  const worldRegion =  req.query.country || US;
  const region = Object.keys(regions).filter(item => item === worldRegion);
  const country = regions[region];

  if (id) {
    getById({ id, sessionId }, res);
  } else if (filter) {
    getByAlphabet({ filter, limitQuery, offsetQuery, country, sessionId }, req, res);
  } else if (domain) {
    getByDomain({ domain, limitQuery, offsetQuery, country, sessionId }, req, res);
  } else {
    getAll({ limitQuery, offsetQuery, country, sessionId }, req, res);
  };
  return true;
};

module.exports = { get, search, searchExt };
