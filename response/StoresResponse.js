/* eslint-disable no-underscore-dangle */
const offerResponse = require("./OfferResponse");
const { sortOffersByValidDateDesc } = require('../utils/sort');
const { getRangeRnd } = require('../utils/math');

const storesResponse = ({items, sessionId, excludeOffers }) => items.map(item => ({
    id: item._id || null,
    skimLinksId: item.skimLinksId || null,
    name: item.name || null,
    logo: item.logo || null,
    priority: item.priority || null,
    domains: item.domains || null,
    domain: item.domain || null,
    countries: item.countries || null,
    country: item.country || null,
    categories: item.categories || null,
    epc: item.epc || null,
    averageCommissionRate: parseFloat(item.averageCommissionRate) || null,
    averageBasketSize: parseFloat(item.averageBasketSize) || null,
    averageConversionRate: parseFloat(item.averageConversionRate) || null,
    specialRateType: item.specialRateType || null,
    offersScore: item.offersScore || null,
    offersLength: item.offers.length || 0,
    offers: excludeOffers 
        ? []
        : offerResponse({elements: item.offers, store:item, sessionId}).sort(sortOffersByValidDateDesc) || null,
    stars: getRangeRnd(3,5) || null,
    indexing: item.indexing || false,
    contentLength: item.seo && item.seo?.contentLength || 0,
    longTail: item.seo && item.seo?.longTail || null,
    description: item.description
}));

module.exports = storesResponse;