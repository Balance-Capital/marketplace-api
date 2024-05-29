const {cleanHtml} = require('../utils/cleanHtml');
const db = require('../models/index');

const productsResponse = async ({items, sessionId }) => {

    const results = await Promise.all( items.map(async (item) => ({
        advertiserName: item?.advertiserName,
        advertiserCountry: item?.advertiserCountry,
        image: item.image,
        brand: item.brand,
        customTitle: cleanHtml(item?.title),
        description: cleanHtml(item?.description).substring(0,160),    
        price: {
            amount: item?.price?.amount,
            currency:  item?.price?.currency
        },
        salePrice: {
            amount:  item?.salePrice?.amount,
            currency:  item?.salePrice?.currency
        },
        discount: item.price.amount - item.salePrice.amount,
        discountPercent: (item.price.amount - item.salePrice.amount) > 0 
            ? ((item.price.amount - item.salePrice.amount) / item.price.amount) * 100
            : 0,
        link:  item.link.replace(/\{sessionId\}/gui, sessionId),
        cashback: (await db.models.Stores.getStoreByName(item.advertiserName))?.averageCommissionRate * 100 || null
    })));

    return results .sort((a) => a.salePrice.amount - a.price.amount);
};

module.exports = productsResponse;