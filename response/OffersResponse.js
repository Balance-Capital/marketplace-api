/* eslint-disable no-underscore-dangle */
const offerResponse = require('./OfferResponse');
const { sortOffersByValidDateAsc } = require('../utils/sort');

const offersResponse = ( ({items, sessionId, limitQuery, offsetQuery}) => 
    items.map( element => offerResponse({elements: element.offers, store: element, sessionId }))
        .flat()
        .sort(sortOffersByValidDateAsc)
        .slice(offsetQuery, offsetQuery+limitQuery)
);

module.exports = offersResponse;