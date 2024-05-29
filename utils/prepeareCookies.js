const moment = require('moment');
const {v4} = require('uuid');
const { COOKIE_NAME } = require('../constants/cookieName');

// const db = require('../models/index');
const getCookies = require('./getCookies');
 
const prepeareCookies = (req) => {
  const cookies = getCookies(req);
  const userTrackerId = cookies[COOKIE_NAME] || v4();
  const expiresTrackerId = moment().add(1, 'year').toDate();
  return {
    name: COOKIE_NAME,
    value: userTrackerId,
    date: {expires: expiresTrackerId}
  }
}

module.exports = prepeareCookies
