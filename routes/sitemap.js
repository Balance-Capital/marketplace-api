const express = require('express');

const router = express.Router();

const { 
    MAP_NAME
} = require('../constants/sitemap');

const db = require('../models/index');

router.get(
    '/', 
    async (req, res, next) => {
    
        if(req.query.type === 'json') {
            db.models.SiteMap.findOne({ name: MAP_NAME }).exec().then(modelSiteMap=>{
                res.json({map: modelSiteMap.map});
            }).catch(()=>{
                next();
            });    
        } else {
            db.models.SiteMap.findOne({ name: MAP_NAME }).exec().then(modelSiteMap=>{
                res.setHeader('Content-Length', modelSiteMap.map.length);
                res.setHeader('Content-Type', 'application/xml');
                res.setHeader('Content-Disposition', 'attachment; filename=sitemap.xml');
                res.write(modelSiteMap.map, 'binary');
                res.end();
            }).catch(()=>{
                next();
            });    
        }
    }
);

module.exports = router;
