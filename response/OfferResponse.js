/* eslint-disable no-underscore-dangle */
const { 
    parserRedirectUrl, 
    parserSeoUrl,
    parserShortTitle
} = require('../utils/parserValue');

const { getRangeRnd } = require('../utils/math');

const offerResponse = ({elements, store, sessionId}) => elements.map( element =>({
    'id': element._id || null,
    'storeId': store && store._id || null,
    'storeLogo': store && store.logo || null,
    'storeName': store && store.name || null,
    'storeDescription': store && store.description || null,
    'stars': getRangeRnd(3,5) || null,
    'verified': element?.checked?.httpStatus === 200,
    'validDate': element.validDate || null,
    'startDate': element.startDate || null,
    'value': element.value || null,
    'valueType': element.valueType || null,
    'currency': element.currency || null,
    'countryCode': element.countryCode || null,
    'image': element.image || null,
    'title': element.shortTitle || element.title || null,
    'shortTitle': element.shortTitle!=='' 
        ? element.shortTitle 
        : parserShortTitle(element.title) || null,
    'description': element.description || null,
    'code': element.code || null,
    'origin': element.origin || null,
    'domain': element.domain || null,
    'originId': element.originId || null,
    'redirectUrl': parserRedirectUrl(element.redirectUrl, sessionId) || element.redirectUrl,
    'seoUrl': parserSeoUrl(element.title) || '',
    'offersScore': store && store.offersScore || null,
    'longTail': store && store?.seo?.longTail || null,
    'offerType': element.offerType || null,
    'salesCommission': parseFloat(store.averageCommissionRate) || null,
    'linkType': element.linkType || null,
    'partnerSource': element.partnerSource === 'scraper_honey' ? -1 : 1 || null
}))

module.exports = offerResponse