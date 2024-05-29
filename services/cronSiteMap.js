/* eslint-disable no-underscore-dangle */
const cron = require('cron');
const moment = require('moment-timezone');
const {google} = require('googleapis');

const { SITE_MAP_FORMAT } = require('../constants/dateTime');

const { 
    GOOGLE_AUTH_SCOPE,
    MAP_NAME,
    SITEMAP_STORES,
    SITEMAP_STATIC
    // SITEMAP_BLOGS
} = require('../constants/sitemap');

const DEFAULT_DATE = moment('2020-10-10T08:00:00').toDate();

let cronSiteMapSchedule = null;
const { TALK_TIMEOUT_MINUTES } = Object.freeze({
    TALK_TIMEOUT_MINUTES: 15
});

const configFile = './resources/private/google_service_account_XXX.json';

const db = require('../models/index');
const { changeFreq } = require('../utils/sitemap');
const logger = require('./logger');
const { ucFirst, lcFirst } = require('../utils/strings');
// const { getBlogs } = require("./ghost");

moment.tz.setDefault('Europe/London');

const serviceTalk = (talk) => {
    try {
        db.models.SiteMap.updateMany(
          { name: MAP_NAME },
          {
            $push: {
                serviceTalk: {text:talk}
            }
          }    
        ).exec().catch(error=>logger.error(error)).then(() => {
            db.models.SiteMap.updateMany(
                { name: MAP_NAME },
                {
                  $pull: {
                    serviceTalk : { timestamps: {$lte: moment().subtract(TALK_TIMEOUT_MINUTES,'minutes').toDate()}}
                  }
                }    
              ).exec().catch(error=>logger.error(error));      
        });
    } catch (error) {
        logger.error(error);
    };

};

const callToGoogle  = async () => {

    const model = await db.models.SiteMap.findOne({ name: MAP_NAME }).exec();

    const auth = new google.auth.GoogleAuth({
        keyFilename: configFile,
        scopes: [GOOGLE_AUTH_SCOPE]
    });
    
    const authClient = await auth.getClient();  
    google.webmasters({version:'v3', auth: authClient})
        .sitemaps.submit({
            feedpath: model.feedPath,
            siteUrl: model.siteUrl
        })
        .then( async result => {
            serviceTalk(JSON.stringify(result))
        })
        .catch( async err => {
            db.models.SiteMap.updateOne(
                { name: MAP_NAME },
                {
                    $push: {
                        serviceTalk: 
                        { 
                            text: JSON.stringify(err), 
                            short: JSON.stringify(err.errors)
                        } 
                    }, 
                    active: false
                }).exec();
        });
        
};

const saveSiteMap = async (records) => {
    db.models.SiteMap.updateOne({ name: MAP_NAME }, { map: records }).exec();  
    serviceTalk('save sitemap');
};

const saveSiteMapStatic = async (records) => {
    db.models.SiteMap.updateOne({ name: MAP_NAME }, { mapStatic: records }).exec();  
    serviceTalk('save sitemap static');
};

function* groupSiteGenerator(array) {
    yield* array;
};

const storeExists = async (storeName) => {
    let exists = false;
    try {
        exists = await db.models.Stores.find({ 
            'offers': { '$ne': [] },
            'isActive': true 
        },{'name':1})
        .or([ 
            { name: new RegExp(`^${lcFirst(storeName)}`) },
            { name: new RegExp(`^${ucFirst(storeName)}`) }
        ])
        .skip(0)
        .limit(1)
        .exec()
        .then((stores) => (stores.length > 0))
        ;
    } catch(error) {
        logger.error(error);
    }
    return exists;
};

const getLastUpdateDate = (frequency, lastDate) => {
    let lastUpdateDate = moment(lastDate)
    if(frequency === changeFreq.daily) {
        const howManyDays = moment().diff(lastUpdateDate, 'days')
        if(howManyDays > 0) {
            lastUpdateDate = lastUpdateDate.add(howManyDays, 'days')
        }
    }
    if(frequency === changeFreq.weekly) {
        const howManyWeeks = moment().diff(lastUpdateDate,'weeks')
        if(howManyWeeks > 0) {
            lastUpdateDate = lastUpdateDate.add(howManyWeeks, 'weeks')
        }
    }
    if(frequency === changeFreq.monthly) {
        const howManyMonths = moment().diff(lastUpdateDate, 'months')
        if(howManyMonths > 0) {
            lastUpdateDate = lastUpdateDate.add(howManyMonths, 'months')
        }
    }
    if(frequency === changeFreq.yearly) {
        const howManyYears = moment().diff(lastUpdateDate, 'years')
        if(howManyYears > 0) {
            lastUpdateDate = lastUpdateDate.add(howManyYears, 'years')
        }
    }
    return lastUpdateDate
};

const generateSiteMapStatic = async () => {
    let modelSiteMap  = [];
    try {
        modelSiteMap = await db.models.SiteMap
        .findOne({ name: MAP_NAME },{staticUrl:1,siteUrl:1})
        .exec()
        .then((results) => {
            const iterableStaticUrls = results.staticUrl;
            const records = [];
            for(let index=0;index < iterableStaticUrls.length; index+=1) {
                records.push({
                    loc: iterableStaticUrls[index].url,
                    lastmod: getLastUpdateDate(iterableStaticUrls[index].changeFreq, DEFAULT_DATE).format(SITE_MAP_FORMAT),
                    changefreq: iterableStaticUrls[index].changeFreq,
                    priority: iterableStaticUrls[index].priority
                });
            };
            return records;        
        });

    } catch (err) {
        logger.error(err);
    }

    return modelSiteMap;
}

// const generateSiteMapBlog = async () => {
//     const [ghostBlogs] = await getBlogs('all', 1)
//     const records = [];
//     try {
//         const iterableStaticUrls = ghostBlogs;
//         for(let index=0;index < iterableStaticUrls.length; index+=1) {
//             records.push({
//                 loc: `https://XXX/blogs/${iterableStaticUrls[index].blogUrl}`,
//                 lastmod:  getLastUpdateDate(changeFreq.weekly, iterableStaticUrls[index].updatedAt).format(SITE_MAP_FORMAT),
//                 changefreq: changeFreq.weekly,
//                 priority: 0.9
//             });
//         };
//     } catch (err) {
//         logger.error(err);
//     }

//     return records;        
// }

const generateSiteMap = async () => {
    const modelSiteMap = await db.models.SiteMap.findOne({ name: MAP_NAME },{siteUrl:1}).exec();
    // const groupSite = await db.models.Stores.getAllOffersForSiteMap();
    const options = {firstMatch:null, lastMatch:null, limitQuery:-1, offsetQuery:0, sort:null, countryCode:'US' };
    const groupSite = await db.models.Stores.filterByValidDate(options);
    const iterableGroupSite = groupSiteGenerator(groupSite);
    const records = [];
    // eslint-disable-next-line no-restricted-syntax
    for(const value of iterableGroupSite) {
        const { origin, domain, seo } = value;
        const _domain = domain || origin;
        records.push({
            loc: `${modelSiteMap.siteUrl}/site/${_domain}${seo?.longTail ? `/${seo?.longTail}` : ''}`,
            lastmod: getLastUpdateDate(changeFreq.weekly, DEFAULT_DATE).format(SITE_MAP_FORMAT),
            changefreq: changeFreq.weekly,
            priority: 0.9
        });
    };

    serviceTalk(`sitemap generated`);
    return records;
}

const parseSiteMap = async () => {

    let record = '<?xml version="1.0" encoding="UTF-8"?>';
    record += '<urlset ';
    record += 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
    record += 'xmlns:xhtml="http://www.w3.org/1999/xhtml" ';
    record += '>';

    record += await generateSiteMap().then((results) => results.map((staticUrl) => {
        let response = '';
        response +='<url>';
        response +=`<loc>${staticUrl.loc}</loc>`;
        response +=`<xhtml:link rel="alternate" hreflang="x-default" href="${staticUrl.loc}"/>`;
        response +=`<lastmod>${staticUrl.lastmod}</lastmod>`;
        response +=`<changefreq>${staticUrl.changefreq}</changefreq>`;
        response +=`<priority>${staticUrl.priority}</priority>`;
        response +='</url>';
        return response;  
    }).join(' '));

    record +='</urlset>';
    serviceTalk(`sitemap parsed`);
    return record;
};

const parseSiteMapsTogether = async () => {

    let record = '<?xml version="1.0" encoding="UTF-8"?>';
    record += '<urlset ';
    record += 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
    record += 'xmlns:xhtml="http://www.w3.org/1999/xhtml" ';
    record += '>';

    record += await generateSiteMapStatic().then((result) => result.map((staticUrl) => {
        let response = '';
        response +='<url>';
        response +=`<loc>${staticUrl.loc}</loc>`;
        response +=`<xhtml:link rel="alternate" hreflang="x-default" href="${staticUrl.loc}"/>`;
        response +=`<lastmod>${staticUrl.lastmod}</lastmod>`;
        response +=`<changefreq>${staticUrl.changefreq}</changefreq>`;
        response +=`<priority>${staticUrl.priority}</priority>`;
        response +='</url>';
        return response;  
    }).join(' '));

    // record += await generateSiteMapBlog().then((result) => result.map((blogUrl) => {
    //     let response = '';
    //     response +='<url>';
    //     response +=`<loc>${blogUrl.loc}</loc>`;
    //     response +=`<xhtml:link rel="alternate" hreflang="x-default" href="${blogUrl.loc}"/>`;
    //     response +=`<lastmod>${blogUrl.lastmod}</lastmod>`;
    //     response +=`<changefreq>${blogUrl.changefreq}</changefreq>`;
    //     response +=`<priority>${blogUrl.priority}</priority>`;
    //     response +='</url>';
    //     return response;  
    // }).join(' '));

    record += await generateSiteMap().then((results) => results.map((url) => {
        let response = '';
        response +='<url>';
        response +=`<loc>${url.loc}</loc>`;
        response +=`<xhtml:link rel="alternate" hreflang="x-default" href="${url.loc}"/>`;
        response +=`<lastmod>${url.lastmod}</lastmod>`;
        response +=`<changefreq>${url.changefreq}</changefreq>`;
        response +=`<priority>${url.priority}</priority>`;
        response +='</url>';
        return response;  
    }).join(' '));

    record +='</urlset>';
    serviceTalk(`sitemap all together parsed`);
    return record;
};

const parseSiteMapStatic = async () => {
    let record = '<?xml version="1.0" encoding="UTF-8"?>';
    record += '<urlset ';
    record += 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
    record += 'xmlns:xhtml="http://www.w3.org/1999/xhtml" ';
    record += '>';
    record += await generateSiteMapStatic().then((result) => result.map((staticUrl) => {
            let response = '';
            response +='<url>';
            response +=`<loc>${staticUrl.loc}</loc>`;
            response +=`<xhtml:link rel="alternate" hreflang="x-default" href="${staticUrl.loc}"/>`;
            response +=`<lastmod>${staticUrl.lastmod}</lastmod>`;
            response +=`<changefreq>${staticUrl.changefreq}</changefreq>`;
            response +=`<priority>${staticUrl.priority}</priority>`;
            response +='</url>';
            return response;  
        }).join(' '));

    record +='</urlset>';
    serviceTalk(`sitemap static generated`);
    return record;
};

const parseOneSiteMapOnly = (maps) => {
    let record = '<?xml version="1.0" encoding="UTF-8"?>';
    record += '<urlset ';
    record += 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
    record += 'xmlns:xhtml="http://www.w3.org/1999/xhtml" ';
    record += '>';
    const map = maps.map((staticUrl) => {
        let response = '';
        response +='<url>';
        response +=`<loc>${staticUrl.loc}</loc>`;
        response +=`<xhtml:link rel="alternate" hreflang="x-default" href="${staticUrl.loc}"/>`;
        response +=`<lastmod>${staticUrl.lastmod}</lastmod>`;
        response +=`<changefreq>${staticUrl.changefreq}</changefreq>`;
        response +=`<priority>${staticUrl.priority}</priority>`;
        response +='</url>';
        return response;  
    });
    record += map.join(' ');
    record +='</urlset>';
    return record;
}

const parseManySiteMaps = async () => {    
    const sitemap = await parseSiteMap();
    db.models.SiteMap.updateMany(
        { name: MAP_NAME, 'maps.name': SITEMAP_STORES }, 
        { $set: { 'maps.$': { name: SITEMAP_STORES , map: sitemap, priority:3 } } },
        {upsert: true}
        ).exec()
        .then(()=>serviceTalk('save sitemap'))
        .catch((err) => serviceTalk(err))
        ;  

    const sitemapStatic = parseOneSiteMapOnly( await generateSiteMapStatic());
    db.models.SiteMap.updateMany(
        { name: MAP_NAME, 'maps.name': SITEMAP_STATIC }, 
        { $set: { 'maps.$': { name: SITEMAP_STATIC, map: sitemapStatic, priority:1 } } },
        {upsert: true}
        ).exec()
        .then(()=>serviceTalk('save sitemapStatic'))
        .catch((err) => serviceTalk(err))
        ;

    // const sitemapBlogs = parseOneSiteMapOnly( await generateSiteMapBlog() );
    // db.models.SiteMap.updateMany(
    //     { name: MAP_NAME, 'maps.name': SITEMAP_BLOGS }, 
    //     { $set: { 'maps.$': { name: SITEMAP_BLOGS, map: sitemapBlogs, priority:2 } } },
    //     {upsert: true}
    //     ).exec()
    //     .catch((err) => serviceTalk(err))
    //     .then(()=>serviceTalk('save sitemapBlogs'));  

    const siteMaps = await db.models.SiteMap.findOne({ name: MAP_NAME },{maps:1,siteUrl:1}).sort({'maps.priority':1}).exec();
    let record = '<?xml version="1.0" encoding="UTF-8"?>';
    record += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const map = siteMaps.maps.sort((a,b) => a.priority - b.priority);
    record += map.map((item) => {
        let result = '';
        result += '<sitemap>';
        result += `<loc>${siteMaps.siteUrl}/${item.name}.xml</loc>`;
        result += '</sitemap>';
        return result;    
    }).join(' ');
    record += '</sitemapindex>';
    serviceTalk(`sitemap many generated`);
    return record;
};

const exit = () => process.exit();

const cronSchedule = new cron.CronJob('*/5 * * * * *', async () => {
    const sitemap = db.models.SiteMap.findOne({name:MAP_NAME}).exec();
    sitemap.then(results => {
        if(!results) return;
        if(cronSiteMapSchedule && cronSiteMapSchedule.running && !results.active) {
            if(cronSiteMapSchedule) {
                cronSiteMapSchedule.stop();
                cronSiteMapSchedule = null;
            };
            db.models.SiteMap.updateOne({name:MAP_NAME},{running: false}).exec();
            serviceTalk(`sitemap cron service disabled`);
            return;
        };
        
        if(!results.active) return;

        if(cronSiteMapSchedule && cronSiteMapSchedule.running) return;

        cronSiteMapSchedule = new cron.CronJob(results.start, async () => {
            serviceTalk(`sitemap start parser`);
            const siteMap = await parseSiteMap();
            saveSiteMap(siteMap);
            // callToGoogle();
        });

        if(cronSiteMapSchedule && !cronSiteMapSchedule.running) {
            cronSiteMapSchedule.start();
            db.models.SiteMap.updateOne({name:MAP_NAME},{running: true}).exec();
            serviceTalk(`sitemap cron service enabled`);
        };

    });    
});

const run = () => {
    cronSchedule.start();
};

const testFunction = async () => {
    // const siteMap = await parseManySiteMaps();
    const siteMap = await parseSiteMap()
    await saveSiteMap(siteMap);
}

if(process.argv[2] === 'start') {
    run();
    serviceTalk(`cron site map start`);        
};

if(process.argv[2] === 'test') {
    testFunction();
};

module.exports = { 
    generateSiteMap, 
    callToGoogle, 
    parseSiteMap, 
    parseSiteMapStatic, 
    saveSiteMap, 
    saveSiteMapStatic,
    run, 
    storeExists,
    exit,
    parseManySiteMaps,
    parseSiteMapsTogether,
    generateSiteMapStatic,
    // generateSiteMapBlog,
    getLastUpdateDate
};