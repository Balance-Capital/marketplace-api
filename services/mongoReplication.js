/* eslint-disable no-await-in-loop */
const {models, connect} = require('../models/replication');
const logger = require('./logger');

let INDX = 0;

const replication = async (collection) => {
  const { dbMain, dbRep } = await connect();
  const source = dbMain.model(collection[0], collection[1].schema);
  const dest = dbRep.model(collection[0], collection[1].schema);
  const collections = await source.find().exec();
  logger.info(`${collection[0]} => ${collections.length}`);
  await dest.insertMany(collections, {upsert:true,ordered:false}).catch (e => {
    logger.error(e);
  });
}

const mongoReplication = async () => {
    try {
      const m = Object.entries(models);
      for(INDX; INDX < m.length; INDX+=1) {
        await replication(m[INDX]);
        // break;
      }
    } catch (error) {
      logger.error(error);
    };

};

mongoReplication()

module.exports = {
  mongoReplication
};
