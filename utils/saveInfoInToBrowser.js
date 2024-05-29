const moment = require('moment');
const { TOKEN_TIMEOUT } = require('../constants/tokenTimeout');
const { COOKIE_NAME } = require('../constants/cookieName');

const logger = require('../services/rollbar');
const saveInfoInToBrowser = (res, user, token) => {
    try {
      const expiresToken = moment().add(TOKEN_TIMEOUT, 'hours').toDate();
      const expiresTrackerId = moment().add(1, 'year').toDate();
      res.cookie('token', token, {expires: expiresToken});
      const cookieId = typeof user.cookieId === 'string' ? user.cookieId : user.cookieId[0];
      res.cookie(COOKIE_NAME, cookieId, {expires: expiresTrackerId});
      const referral = user.referralCode || null;
      if(referral) {
        const expiresReferralId = moment().add(1, 'year').toDate();
        res.cookie('referral', referral, {expires: expiresReferralId});  
      };  
    } catch(err) {
      logger.warning(`Issue during save info to browser cookie: ${err?.message}`, res, err);
    }
}

module.exports = saveInfoInToBrowser;