const {DOMParser, XMLSerializer} = require('xmldom');
const {logger} = require('../services/logger');

const { ABOUT_OFFERS, FAQ, DESCRIPTION } = require('../constants/findAndReplaceFields');

const db = require('../models/index');

const doChanges = (source, where, what, replace) => {
    const parser = new DOMParser();
    const document = parser.parseFromString(source, 'text/html');
    const how = document.getElementsByTagName(where).length;
    for(let x = 0; x < how; x += 1) {
        const {name} = document.getElementsByTagName(where)[x].attributes[0];
        const {value} = document.getElementsByTagName(where)[x].attributes[0];
        if( name === 'class' &&  value === what) {
            document.getElementsByTagName(where)[x].attributes[0].value = replace;
        }
    }
    const serialize = new XMLSerializer();
    return serialize.serializeToString(document);
}

const createBackup = (id, value) => {
    const backup = {
        $push : {backup: value}
    };
    db.models.Stores.updateOne({_id: id}, backup)
    .exec()
    .catch((error) => logger.error(error));
}

const findAndReplaceTool = async (parameters) => {
    const {queryField, findWhat, findWhere, replaceWhat, test } = parameters;
    const query = new RegExp(`${findWhat}`);
    const stringReplace = `${replaceWhat}`;
    const replaced = [];

    const arg = [];
    switch(queryField) {
        case ABOUT_OFFERS: 
            arg[0] = { aboutOffers: { $regex: query} }; 
            arg[1] = { aboutOffers: 1 }; 
            arg[2] = { aboutOffers: null }; 
        break;
        case DESCRIPTION: 
            arg[0] = { description: { $regex: query} }; 
            arg[1] = { description: 1 }; 
            arg[2] = { description: null }; 
        break;
        case FAQ: 
            arg[0] = { faq: { $regex: query} }; 
            arg[1] = { faq: 1 }; 
            arg[2] = { faq: null }; 
        break;
        default: 
            arg[0] = { aboutOffers: { $regex: query} }; 
            arg[1] = { aboutOffers: 1 }; 
            arg[2] = { aboutOffers: null }; 
        break;
    };

    return db.models.Stores.find(arg[0], arg[1]).exec().then((founds) => {
        const howMany = founds.length;
        founds.forEach((item) => {
            switch(queryField) {
                case ABOUT_OFFERS:
                    arg[2] = { aboutOffers: doChanges(item.aboutOffers, findWhere, findWhat, stringReplace) }; 
                break;
                case DESCRIPTION: 
                    arg[2] = { description: doChanges(item.description, findWhere, findWhat, stringReplace) }; 
                break;
                case FAQ: 
                    arg[2] = { faq: doChanges(item.faq, findWhere, findWhat, stringReplace) }; 
                break;
                default: 
                    arg[2] = { aboutOffers: doChanges(item.aboutOffers, findWhere, findWhat, stringReplace) }; 
                break;
            };
        
            if(!test) {
                // eslint-disable-next-line no-underscore-dangle
                db.models.Stores.findOneAndUpdate({ _id: item._id}, arg[2]).exec();
                // eslint-disable-next-line no-underscore-dangle
                createBackup(item._id, arg[2]);
            }
            replaced.push({
                origin: item.aboutOffers,
                replace: arg[2]
            });
        });
        return {
            queryField,
            howMany,
            findWhat,
            findWhere,
            replaceWhat,
            replaced
        };
    });
};

module.exports = {
    findAndReplaceTool,
    doChanges
};