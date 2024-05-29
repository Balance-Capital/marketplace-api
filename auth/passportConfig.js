/* eslint-disable no-underscore-dangle */
const GoogleStrategy = require('passport-google-oauth2');
const FacebookStrategy = require('passport-facebook');
const LocalStrategy = require('passport-local');
const requestIP = require('request-ip');

const JwtStrategy = require("passport-jwt").Strategy;
const { ExtractJwt } = require("passport-jwt");

const { getOrCreateUser, emailLogin } = require('../controllers/UsersController');
const logger = require('../services/logger');
const getCookies = require('../utils/getCookies');
const { COOKIE_NAME } = require('../constants/cookieName');

module.exports = (passport) => {

  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_AUTH_ID,
      clientSecret: process.env.GOOGLE_AUTH_SECRET,
      callbackURL: process.env.GOOGLE_AUTH_CALLBACK,
      scope: [ 'profile', 'email' ],
      state: true,
      passReqToCallback: true
    }, 
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        const cookieId = request?.cookies[COOKIE_NAME] || getCookies(request)[COOKIE_NAME] || null;
        const username = profile?.email || profile?.id || null; 
        const secret = profile?.id || null; 
        const walletAddress = null;
        const requestip = requestIP.getClientIp(request);
        const remoteAddressIp = requestip || request?.connection?.remoteAddress || null;
        const email = profile?.email || null;
        const displayName = profile?.displayName || null;
        const externalId = profile?.id || null; 
        const externalProviderName = 'google';
        const referralCode = request?.cookies?.referral || getCookies(request)?.referral || null;

        const user = await getOrCreateUser(cookieId, username, secret, walletAddress, remoteAddressIp, email, displayName, externalId, externalProviderName, referralCode);
        return done(null, user);
      } catch (error) {
        logger.error(`Google strategy: ${error?.message}, stack: ${error?.stack}`);
        return done(error, false);
      }
    }
    )
  );

  passport.use(
    new FacebookStrategy({
      clientID: process.env.FACEBOOK_AUTH_ID,
      clientSecret: process.env.FACEBOOK_AUTH_SECRET,
      callbackURL: process.env.FACEBOOK_AUTH_CALLBACK,
      passReqToCallback: true,
      state: true,
      profileFields: ['id', 'displayName', 'email']
    },
    async (request, accessToken, refreshToken, profile, done) => {
      const jsonProfile = profile._json;
      try {
        const cookieId = request?.cookies[COOKIE_NAME] || getCookies(request)[COOKIE_NAME] || null;
        const username = jsonProfile?.email || profile?.id || null; 
        const secret = profile?.id || null; 
        const walletAddress = null;
        const requestip = requestIP.getClientIp(request);
        const remoteAddressIp = requestip || request?.connection?.remoteAddress || null;
        const email = jsonProfile?.email || null;
        const displayName = jsonProfile?.displayName || null;
        const externalId = jsonProfile?.id || null; 
        const externalProviderName = 'facebook';
        const referralCode = request?.cookies?.referral || getCookies(request)?.referral || null;

        const user = await getOrCreateUser(cookieId, username, secret, walletAddress, remoteAddressIp, email, displayName, externalId, externalProviderName, referralCode);
        return done(null, user);
      } catch (error) {
        logger.error(`Facebook strategy: ${error?.message}, stack: ${error?.stack}`);
        return done(error, false)
      }
    }
    )
  );

  passport.use(new LocalStrategy({
    passReqToCallback: true,
    session: false
    },
    async (request, username, password, done) => {  
      try {
        const requestip = requestIP.getClientIp(request);
        const remoteAddressIp = requestip || request?.connection?.remoteAddress || null;

        const user = await emailLogin({ username, password, lastIp: remoteAddressIp });
        return done(null, user);
      } catch (error) {
        logger.error(`Local strategy: ${error?.message}, stack: ${error?.stack}`);
        return done(error, false)
      }
    }
  ));

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || 'SecretKey'
      },
      async (jwtPayload, done) => {
        try {
          return done(null, jwtPayload);
        } catch (error) {
          logger.error(`JWT strategy: ${error?.message}, stack: ${error?.stack}`);
          return done(error, false);
        }
      }
    )
  );

};
