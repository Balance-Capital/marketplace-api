const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const helmet = require("helmet");

const logger = require('./services/logger');

const routeReferrals = require('./routes/referrals');
const routeIndex = require('./routes/index');
const routeOffers = require('./routes/offers');
const routeUsers = require('./routes/users');
const routeAuth = require('./routes/auth');
const routeVisitors = require('./routes/visitors');
const routeStores = require('./routes/stores');
const routeSearch = require('./routes/search');
const routeSearchExt = require('./routes/searchExt');
const routeSiteMap = require('./routes/sitemap');
const routeSiteMapStatic = require('./routes/sitemapStatic');
// const routeSiteMapBlogs = require('./routes/sitemapBlogs');
const routeSiteMapStores = require('./routes/sitemapStores');
const dashBoard = require('./routes/dashboard');
// const refresher = require('./routes/refresher');
const findAndReplaceCss = require('./routes/findAndReplaceCss');
const jarvisEndpoints = require('./routes/jarvisEndpoints');
const routeAffiliateDashboard = require('./routes/affiliateDashboard');
const routeMyRewards = require('./routes/myRewards');
const routeSettings = require('./routes/settings');
const routeProducts = require('./routes/products');
const routeWallets = require('./routes/wallets');
const routeWithdraw = require('./routes/withdraw');

const middleware = require('./middleware/index');

const app = express();

app.use(helmet());

app.disable('x-powered-by');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const corsOption = {
    origin: process.env.CORS_ALLOW_LIST.split(','),
    methods: 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    // allowedHeaders: 'Content-Type,Authorization,Accept'
    allowedHeaders: '*'
}
app.use(cors(corsOption));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({limit: '50mb'}));
app.use(middleware);
app.use(
    mongoSanitize({
        allowDots: true,
        replaceWith: '_',
        onSanitize: ({ req, key }) => {
            logger.warn(`This request[${key}] is sanitized`, req);
        }
    })
);

// passport and user
app.use(require('express-session')({ secret: 'secretsalt',  resave: false, secure: false, saveUninitialized: true }));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => { done(null, user) });
passport.deserializeUser((user, done) => { done(null, user) });
app.use('/auth', routeAuth(passport));

app.use('/', routeIndex);
app.use('/offers', routeOffers);
app.use('/users', routeUsers);
app.use('/visitors', routeVisitors);
app.use('/stores', routeStores);
app.use('/search', routeSearch);
app.use('/search-ext', routeSearchExt);
app.use('/dashboard', dashBoard(passport));
// app.use('/refresher', refresher);
app.use('/findandreplacecss', findAndReplaceCss);
app.use('/seo', jarvisEndpoints);
app.use('/products', routeProducts);
app.use('/wallets', routeWallets(passport));
app.use('/withdraw', routeWithdraw(passport));

app.use('/referrals', routeReferrals(passport));
app.use('/affiliate-dashboard', routeAffiliateDashboard(passport));
app.use('/myrewards', routeMyRewards(passport));
app.use('/settings', routeSettings(passport));

// SITEMAPS
app.use('/sitemap.xml', routeSiteMap);
app.use('/sitemap_static.xml', routeSiteMapStatic);
// app.use('/sitemap_blogs.xml', routeSiteMapBlogs);
app.use('/sitemap_stores.xml', routeSiteMapStores);

module.exports = app;
