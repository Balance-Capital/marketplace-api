const offerResponse = require("./OfferResponse");
const storeResponse = require("./StoreResponse");
const { sortOffersByValidDateAsc } = require('../utils/sort');

const storeSiteResponse = ({store, availableOffers, similarCoupons, jsonLd, featureRetailer, sessionId }) => ({
    'jsonLd' : jsonLd || null,
    'availableOffers' : availableOffers || store.offersScore,
    'similarCoupons' : similarCoupons || null,
    'featureRetailer' : featureRetailer || null,
    'store' : storeResponse({store}) || null,
    'offersLength' : store.offers.length || null,
    'offersScore': store.offersScore || null,
    'categories': store.categories || [],
    'offers' : offerResponse({elements: store.offers, store, sessionId}).sort(sortOffersByValidDateAsc) || null
});

module.exports = storeSiteResponse;