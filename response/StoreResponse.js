/* eslint-disable no-underscore-dangle */
const { getRangeRnd } = require('../utils/math');

const storeResponse = ({ store }) => ({
    id: store._id || null,
    skimLinksId: store.skimLinksId || null,
    name: store.name || null,
    logo: store.logo || null,
    priority: store.priority || null,
    domains: store.domains || null,
    domain: store.domain || null,
    countries: store.countries || null,
    country: store.country || null,
    categories: store.categories || null,
    epc: parseFloat(store.epc) || null,
    averageCommissionRate: parseFloat(store.averageCommissionRate) || null,
    averageBasketSize: parseFloat(store.averageBasketSize) || null,
    averageConversionRate: parseFloat(store.averageConversionRate) || null,
    specialRateType: store.specialRateType || null,
    faq: store.faq || null,
    aboutOffers: store.aboutOffers || null,
    description: store.description || null,
    offersScore: store.offersScore || null,
    meta: store.meta || null,
    stars: getRangeRnd(3,5) || null,
    indexing: store.indexing || false,
    contentLength: store.seo && store.seo?.contentLength || 0,
    longTail: store.seo && store.seo?.longTail || null,
    offersLength: store?.offers.length || 0
});

module.exports = storeResponse;