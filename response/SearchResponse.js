/* eslint-disable no-underscore-dangle */
const { sortSearchByNameAsc } = require('../utils/sort');

const searchResponse = ({ search }) => search.map( store => ({
    "id": store._id,
    "name": store.name,
    "logo": store.logo,
    "domain": store.domain,
    "priority": store.priority,
    "offersLength": store.offers.length,
    "offersScore": store.offersScore,
    "categories": store.categories || [],
    "description": store.description
})).sort(sortSearchByNameAsc);

module.exports = searchResponse;