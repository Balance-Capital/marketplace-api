const express = require('express');

const router = express.Router();

const { 
    MAP_NAME, SITEMAP_STORES
} = require('../constants/sitemap');

const db = require('../models/index');

router.get(
    '/', 
    async (req, res, next) => {
    
        if(req.query.type === 'json') {
            db.models.SiteMap.findOne({ name: MAP_NAME, 'maps.name': SITEMAP_STORES },{'maps.$':1}).exec().then(modelSiteMap=>{
                res.json({map: modelSiteMap.maps[0].map});
            }).catch(()=>{
                next();
            });    
        } else {
            db.models.SiteMap.findOne({ name: MAP_NAME, 'maps.name': SITEMAP_STORES },{'maps.$':1}).exec().then(modelSiteMap=>{
                res.setHeader('Content-Length', modelSiteMap.maps[0].map.length);
                res.setHeader('Content-Type', 'application/xml');
                res.setHeader('Content-Disposition', `attachment; filename=${modelSiteMap.maps[0].name}.xml`);
                res.write(modelSiteMap.maps[0].map, 'binary');
                res.end();
            }).catch(()=>{
                next();
            });    
        }
    }
);

module.exports = router;
