/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
const { validationResult } = require('express-validator');
// const request = require('request');
// const path = require('path');
const { ObjectId } = require('bson');
// const moment = require('moment');

const { QUERY_OFFSET, QUERY_LIMIT } = require('../constants/query');
// const { S3_IMAGE_FOLDER, S3_STORE_IMAGE_FOLDER } = require('../constants/S3');
const offersFilterValidDateSelect = require('../constants/offersFilterValidDateSelect');

const {
  // RESPONSE_OK,
  RESPONSE_STATUS_OK,
  RESPONSE_NO_FOUND,
  RESPONSE_STATUS_NO_FOUND,
  RESPONSE_STATUS_WRONG_PARAMS,
  RESPONSE_STATUS_ERROR
  // RESPONSE_BAD_REQUEST,
  // RESPONSE_STATUS_BAD_REQUEST
} = require('../constants/httpResponse');

// const { OTHER } = require('../constants/offersValueType');
// const { DEFAULT_IMAGE_STORE } = require('../constants/defaultImageStore');
// const { MOMENT_DAY } = require('../constants/dateTime');

const {
  STORE_ID
  // REPORT_IMPORT_OFFERS_DAILY,
  // CACHE_DEFAULT_KEY
} = require('../constants/cacheKeyNames');

// const {
//   CACHE_DEFAULT_EXPIRE
// } = require('../constants/cacheDefaultExpire');

const {
  SKIM_LINKS,
  EBAY,
  COMMISSION_JUNCTION
} = require('../constants/partnersName');

const db = require('../models/index');
// const { uploadFileToS3, notExistsFile } = require('../services/s3');
const logger = require('../services/logger');
const offerResponse = require('../response/OfferResponse');
const offersResponse = require('../response/OffersResponse');
// const { getFileExt, normalizeName } = require('../utils/files');
const i18n = require('../services/i18n');
// const { offersScoreFunction } = require("../utils/offersScore");
// const { getOriginDomain } = require('../utils/getOriginDomain');
// const { findTitle, makeTitle } = require('../utils/makeTitle');
// const { logTimeOperations } = require('../utils/logTimeOperation');
const { getCache } = require('../utils/getCache');
require('../services/cacheRedis');

const getAll = ({ limitQuery, offsetQuery, sessionId }, response) => {
  db.models.Stores.filterByValidDate({
    lastMatch:{ $match: { offers: { $not: { $size:0 } } } },
    limitQuery,
    offsetQuery,
    sort:{ 'offers.validDate': -1 }
  })
    .then((result) => {
      if (result && result.length === 0) {
        response.status(RESPONSE_STATUS_NO_FOUND).json(RESPONSE_NO_FOUND);
        return;
      }

      response.status(RESPONSE_STATUS_OK).json(
        offersResponse({
          items: result,
          sessionId,
          limitQuery,
          offsetQuery
        })
      );
    })
    .catch((err) => {
      logger.error(`Get all offers: ${err}`);
      response.status(RESPONSE_STATUS_ERROR).json(err);
    });
};

const getById = async ({ id, sessionId }, response) => {
  try {
    id = new ObjectId(id);
  } catch (err) {
    response.status(RESPONSE_STATUS_WRONG_PARAMS).json(i18n.__('wrongId'));
    return;
  };

  const offersFilterId = {
    'offers._id': id
  };  
  const project = {
    ...offersFilterValidDateSelect,
    'offers.$':1
  };

  const query = db.models.Stores.find(offersFilterId,project);
    getCache(query, db.models.RedisCacheKeys, STORE_ID)
      .then(result => {

        if (result && result.length === 0) {
          response.status(RESPONSE_STATUS_NO_FOUND).json(RESPONSE_NO_FOUND);
          return;
        }

        response.status(RESPONSE_STATUS_OK).json(
          offerResponse({
            elements: result[0].offers,
            store: result[0],
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

  const { id } = req.query || null;
  const { sessionId } = req.query || null;

  if (id) {
    getById({ id, limitQuery, offsetQuery, sessionId }, res);
  } else {
    getAll({ limitQuery, offsetQuery, sessionId }, res);
  }
};

/**
 * IMPORT OFFERS PART
 */

// const uploadImages = async (item, store) => {
//   const chunks = [];
//   const imagePlaceHolder = 'placeholder.png';

//   let offerImage = `${S3_IMAGE_FOLDER}${imagePlaceHolder}`;
//   let storeLogo = `${S3_STORE_IMAGE_FOLDER}${imagePlaceHolder}`;
//   if (item.image) {
//     const filename = path.basename(item.image);
//     const storeImageFilename = `${normalizeName(store.name)}.${getFileExt(
//       filename
//     )}`;
//     offerImage = `${S3_IMAGE_FOLDER}${filename}`;
//     storeLogo = `${S3_STORE_IMAGE_FOLDER}${storeImageFilename}`;
//     notExistsFile(offerImage, () => {
//       try{
//         request(item.image)
//         .on('data', (chunk) => chunks.push(Buffer.from(chunk)))
//         .on('end', () => {
//           const uploadFile = Buffer.concat(chunks);
//           uploadFileToS3(offerImage, uploadFile);
//         })
//       } catch(error) {
//         logger.error(error);
//       }
//     });
//     notExistsFile(storeLogo, () => {
//       try{
//         request(item.image)
//         .on('data', (chunk) => chunks.push(Buffer.from(chunk)))
//         .on('end', () => {
//           const uploadFile = Buffer.concat(chunks);
//           uploadFileToS3(storeLogo, uploadFile);
//         })
//       } catch(error) {
//         logger.error(error);
//       }
//     });
//   }
//   return { offerImage, storeLogo };
// };

// const reportImportOffersDaily = async (store, importOffer, allImport) => {
//   const storeDomain = getOriginDomain(importOffer.domains[0]);
//   const query = db.models.OffersReport.findOne(
//     {
//       createdAt: {
//         $gte: moment().startOf(MOMENT_DAY),
//         $lte: moment().endOf(MOMENT_DAY)
//       },
//       storeDomain
//     });

//   const queryCache = getCache(query, db.models.RedisCacheKeys, REPORT_IMPORT_OFFERS_DAILY);
    
//   queryCache
//     .then(async model => {
//       const tsRIOD = new Date().getTime();

//       const newOffersOriginId = allImport.filter(pos=>pos.domains[0]===importOffer.domains[0]).map(pos=>pos.originId);
//       const incomeOffers = newOffersOriginId.length;
//       const oldOffers = db.models.Stores
//         .find({'offers.originId': {$in: newOffersOriginId}})
//         .count()
//         ;
//       const oldOffersCache = await getCache(oldOffers, db.models.RedisCacheKeys, REPORT_IMPORT_OFFERS_DAILY);
      
//       const newOffers = incomeOffers - oldOffersCache;
    
//       if(model) {
//           model.storeDomain = storeDomain;
//           model.countOffers = store && store.offers && store.offers.length || 0;
//           model.countNewOffers = model.countNewOffers + newOffers || 0;
//           model.countIncomeOffers = incomeOffers || 0;
//           model.countIncomeDuplicate = oldOffersCache || 0;
//           model.partnersName = null;
//           model.save().catch(err=>logger.error(err)).then(result=>result);
//         } else {
//           model = new db.models.OffersReport({
//             storeDomain,
//             countOffers: store && store.offers && store.offers.length || 0,
//             countNewOffers: newOffers || 0 ,
//             countIncomeOffers: incomeOffers || 0,
//             countIncomeDuplicate: oldOffersCache || 0,
//             partnersName: null  
//           });
//           model.save().catch(err=>logger.error(err)).then(result=>result);
//         };
//       logTimeOperations('reportImportOffersDaily', (new Date().getTime() - tsRIOD)/1000);
//   });

// };

// const updateOrAddNew = async (store, importOffer) => {
//   try {

//     if(importOffer && importOffer.valueType === null) {
//       importOffer.valueType = OTHER;
//     }
//     // const { offerImage, storeLogo } = await uploadImages(importOffer, store);
//     // const offerImage = null; 
//     const storeLogo  = null;

//     const originDomain = getOriginDomain(importOffer.origin);
//     importOffer.domain = originDomain;
//     importOffer.priority = 11;
//     // importOffer.image = offerImage;
    
//     if(!store) {
//       const shortTitle = await makeTitle(
//         importOffer.value, 
//         importOffer.valueType === 'currency' ? importOffer.currency : '%', 
//         importOffer.title, 
//         0
//       );      
//       importOffer.shortTitle = shortTitle.value;

//       const seo = {
//         longTail: null,
//         contentLength: (importOffer?.shortTitle?.length || 0 + importOffer?.description?.length || 0)
//       }
  
//       // add new one
//       const newStore = new db.models.Stores({
//         skimLinksId: null,
//         name: importOffer.advertiserName,
//         logo: storeLogo || DEFAULT_IMAGE_STORE,
//         priority: 11,
//         domains: importOffer.domains,
//         countries: importOffer.countryCode,
//         country: importOffer.country,
//         categories: importOffer.categories,
//         epc:null,
//         averageCommissionRate: null,
//         averageBasketSize: null,
//         averageConversionRate: null,
//         specialRateType: null,
//         offers: importOffer,
//         description: importOffer?.description || null,
//         faq: [],
//         aboutOffers: null,
//         meta: null,
//         offersScore: offersScoreFunction([importOffer]),
//         domain: originDomain,
//         seo
//       });      
//       newStore.save().catch(error=>logger.error(error));  

//     } else if (store) {

//       const tsFT0 = new Date().getTime();
//       const shortTitle = await findTitle(
//         importOffer.value, 
//         importOffer.valueType === 'currency' ? importOffer.currency : '%',
//         importOffer.title, 
//         store
//       );
//       importOffer.shortTitle = shortTitle;
//       logTimeOperations('findTitle', ((new Date().getTime()) - tsFT0)/1000);

//       const categories = new Set(store.categories);
//       categories.add(...importOffer.categories);  
//       importOffer.priority = store.priority || -1;

//       const offerIndex = await db.models.Stores.find({
//         'offers.originId':importOffer.originId
//       }, {
//         'offers.$':1
//       })
//       .cache({key: CACHE_DEFAULT_KEY, expire: CACHE_DEFAULT_EXPIRE})
//       .exec();
      
//       if (offerIndex && offerIndex?.length === 0) {

//         const updateLogTime = new Date().getTime();

//         await db.models.Stores.updateOne({
//           _id: store._id
//         }, {
//           categories: [...categories],
//           // offersScore: offersScoreFunction(store.offers),
//           domain: originDomain,
//           // logo: storeLogo,
//           $push: {
//             offers: importOffer
//           }
//         })
//         .exec()
//         .then(()=>logTimeOperations('updateOneRecord', (new Date().getTime() - updateLogTime)/1000))
//         .catch(error=>logger.error(error))
//         ;

//       } else {
//         const updateLogTime = new Date().getTime();

//         await db.models.Stores.updateOne({
//           _id: store.id,
//           'offers._id': { $in: offerIndex[0].offers.map(item=>ObjectId(`${item._id}`)) }
//         }, {
//           categories: [...categories],
//           // offersScore: offersScoreFunction(store.offers),
//           domain: originDomain,
//           // logo = storeLogo,
//           $set: {
//             'offers.$.priority': store.priority || -1,
//             'offers.$.partnerSource': importOffer.partnerSource || null,
//             'offers.$.shortTitle': shortTitle,
//             'offers.$.domain': originDomain,
//             'offers.$.categories': importOffer.categories,
//             'offers.$.description': importOffer.description,
//             'offers.$.salesCommission': importOffer.salesCommission,
//             'offers.$.savingType': importOffer.savingType,
//             'offers.$.linkType': importOffer.linkType,
//             'offers.$.image': importOffer.image,
//             'offers.$.countryCode': importOffer.countryCode ? [importOffer.countryCode] : ['US']
//           }
//         })
//         .exec()
//         .catch(error=>logger.error(error))
//         .then(()=>logTimeOperations('updateOneRecord', (new Date().getTime() - updateLogTime)/1000))
//         ;

//       };
//     }
//   } catch (error) {
//     logger.error(error);
//   }

// }

// function* importGenarator(array) {
//   return yield* array;
// }

// const create = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
//     return;
//   }

//   if (!req.body[0]) {
//     res.status(RESPONSE_STATUS_BAD_REQUEST).json(RESPONSE_BAD_REQUEST);
//     return;
//   }

//   try {
//     const importDomains = [];
//     const imports = importGenarator(req.body);
    
//     const ts0 = new Date().getTime();

//     for(const item of imports) {

//       const tsGS = new Date().getTime();
//       const store = await db.models.Stores.findOne({
//         domains: item.origin
//       }, {
//         _id:1,
//         categories:1, 
//         priority:1
//       })
//       .cache({key: CACHE_DEFAULT_KEY, expire: CACHE_DEFAULT_EXPIRE})
//       .exec()
//       .catch(error=>logger.error(error));
//       logTimeOperations('getStores', (new Date().getTime() - tsGS)/1000);

//       const tsNU = new Date().getTime();
//       await updateOrAddNew(store, item);
//       logTimeOperations('updateOrAddNew', (new Date().getTime() - tsNU)/1000);

//       /**
//        * Report for daily import
//        */
//       // eslint-disable-next-line no-continue
//       if(importDomains.filter(pos => pos === item.domains[0]).length > 0) continue;
//       // importDomains.push(item.domains[0])
//       // const importOffer = item; 
//       // const allImport = req.body;
//       // reportImportOffersDaily(store, importOffer, allImport);
//     };
//     const ts1 = new Date().getTime();
//     logTimeOperations('main import loop', (ts1 - ts0)/1000);

//     res.status(RESPONSE_STATUS_OK).json(RESPONSE_OK);
//   } catch (error) {
//     logger.error(error);
//     res.status(RESPONSE_STATUS_ERROR).json(error);
//   };

// };

const askForLastOffersId = async (req, res) => {

  const partners = [
    SKIM_LINKS,
    EBAY,
    COMMISSION_JUNCTION
  ];

  const results = await Promise.all( partners.map( async (item) => ({
      partner: item,
      id: await db.models.Stores.find({'offers.partnerSource': item}, {'offers.originId': 1})
            .exec()
            .then((result) => {
              const offers = result.map((element) => element.offers.map((offer) => offer.originId)).flat();
              if(offers) {
                return offers.filter((elem, pos) => offers.indexOf(elem) === pos).sort((a,b) => b-a)[0];
              }
              return 0;
            })
    })));
    
    res.status(RESPONSE_STATUS_OK).json(results);
}

module.exports = { get, askForLastOffersId };
