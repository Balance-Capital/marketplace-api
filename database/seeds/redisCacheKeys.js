const {
    FILTER_BY_VALID_DATE,
    SIDEBAR_GET_SIMILAR_COUPONS,
    SIDEBAR_FEATURE_RETAILER,
    FILTER_BY_EXPIRED_OFFERS,
    OFFERS_SCORE_FUNCTION,
    REDIS_CACHE_CONFIG,
    STORE_ID,
    CACHE_TITLE_GENERATOR,
    REPORT_IMPORT_OFFERS_DAILY,
    CACHE_DEFAULT_KEY
} = require('../../constants/cacheKeyNames');

const db = require('../../models/index');


const run = () => {

    db.models.RedisCacheKeys.insertMany([
    {
        name: FILTER_BY_VALID_DATE,
        active: true,
        expire: 86400
    },
    {
        name: SIDEBAR_GET_SIMILAR_COUPONS,
        active: true,
        expire: 86400
    },
    {
        name: SIDEBAR_FEATURE_RETAILER,
        active: true,
        expire: 86400
    },
    {
        name: FILTER_BY_EXPIRED_OFFERS,
        active: true,
        expire: 86400
    },
    {
        name: OFFERS_SCORE_FUNCTION,
        active: true,
        expire: 86400
    },{
        name: REDIS_CACHE_CONFIG,
        active: true,
        expire: 300
    },{
        name: STORE_ID,
        active: true,
        expire: 86400
    },{
        name: CACHE_TITLE_GENERATOR,
        active: true,
        expire: 3600
    },{
        name: REPORT_IMPORT_OFFERS_DAILY,
        active: true,
        expire: 3600
    },{
        name: CACHE_DEFAULT_KEY,
        active: true,
        expire: 3600
    }],{upsert:1});

};

module.exports = { run };
