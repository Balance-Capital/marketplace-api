const moment = require('moment');

const {
    PERCENTAGE,
    CURRENCY
} = require('../constants/offersValueType');

const sortOfferDesc = (a, b) => {
    let aType = 0;
    let bType = 0;
    
    switch(a.valueType) {
        case PERCENTAGE: aType = 2;break;
        case CURRENCY: aType = 1;break;
        default: aType = -1;
    };

    switch(b.valueType) {
        case PERCENTAGE: bType = 2;break;
        case CURRENCY: bType = 1;break;
        default: bType = -1;
    };

    return (aType + a.value) < (bType + b.value)
        ? 1 
        : -1
        ;
};

const sortStoreByOffersLengthDesc = (a, b) => a.offers.length < b.offers.length ? 1 : -1;

const sortOffersByValidDateAsc = (a, b) => {
    const firstDate = moment(a.validDate).startOf('day');
    const secondDate = moment(b.validDate).startOf('day');

    return firstDate.diff(secondDate,'days') > 0 ? 1 : -1;
};

const sortOffersByValidDateDesc = (a, b) => {
    const firstDate = moment(a.validDate).startOf('day');
    const secondDate = moment(b.validDate).startOf('day');

    return firstDate.diff(secondDate,'days') > 0 ? -1 : 1;
};

const sortSearchByNameAsc = (a, b) => {
    if(a.name.toLowerCase() < b.name.toLowerCase()) {
        return -1;
    }
    if(a.name.toLowerCase() > b.name.toLowerCase()) {
        return 1;
    }
    return 0;
};

module.exports = { 
    sortOfferDesc, 
    sortStoreByOffersLengthDesc, 
    sortOffersByValidDateAsc, 
    sortOffersByValidDateDesc,
    sortSearchByNameAsc 
}