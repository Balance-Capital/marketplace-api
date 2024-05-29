require('dotenv').config();
const Mongoose = require('mongoose');
const logger = require('../services/logger');

const Users = require('./users');
const Visitors = require('./visitors');
const Stores = require('./stores');
const SiteMap = require('./sitemaps');
const OffersReport = require('./offersReport');
const DashBoard = require('./dashBoard');
const RedisCacheKeys = require('./redisCacheKeys');
const LogProcess = require('./logProcess');
const Referrals = require('./referrals');
const Products = require('./products');
const Wallets = require('./wallets');
const Withdraw = require('./withdraw');
const Mails = require('./mails');
const ReferralsClick = require('./referralsClicks');
const Categories = require('./categories');

const db = {
  models: {
    Referrals,
    Users,
    Visitors,
    Stores,
    SiteMap,
    OffersReport,
    DashBoard,
    RedisCacheKeys,
    LogProcess,
    Products,
    Wallets,
    Withdraw,
    Mails,
    ReferralsClick,
    Categories
  }
};

const mongooseOptions = {
  autoIndex: Boolean(process.env.MONGO_DB_AUTO_INDEX === 'true'),
  useNewUrlParser: true,
  useUnifiedTopology: true
};

Mongoose.set('debug', Boolean(process.env.MONGO_DB_DEBUG === 'true'));

(async () => {
  try {
    Mongoose.connect(process.env.MONGO_DB_CONNECTION, mongooseOptions)
  } catch (e) {
    logger.error(`[MongoDB] Connection error: ${e?.message}`, e);
  }
})();

module.exports = db;