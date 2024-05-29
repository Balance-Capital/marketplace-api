/* eslint-disable no-underscore-dangle */
const offerRespone = require('./OfferResponse');
const { sortSearchByNameAsc } = require('../utils/sort');

const searchExtResponse = ({ items, sessionId }) => items.map( store => ({
    "id": store._id,
    "name": store.name,
    "logo": store.logo,
    "domain": store.domain,
    "priority": store.priority,
    "offersLength": store.offers.length,
    "offersScore": store.offersScore,
    "categories": store.categories || [],
    "description": store.description,
    "offers": offerRespone({elements: store.offers, store, sessionId}) 
})).sort(sortSearchByNameAsc);

module.exports = searchExtResponse;