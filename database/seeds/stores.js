const csv = require('csv-parser');
const fs = require('fs');

const db = require('../../models/index');

const fileCsv = './database/seeds/files/companies.csv';

const logger = require('../../services/logger');

const run = () => {
    const collections = [];

    fs.createReadStream(fileCsv)
    .pipe(csv(['Id','Name','Priority','Domains','Countries','Country','Categories','EPC','Average_Commission_Rate','Average_Basket_Size','Average_Conversion_Rate','Special_Rate_Type']))
    .on('data', (data) => {
        collections.push(data);
    })
    .on('end', () => {
        collections.forEach(item => {
            db.models.Stores.findOne({name:item.Name})
                .exec()
                .then( result => {
                    if(!result) {
                        db.models.Stores.create({
                            skimLinksId: Number(item.Id),
                            name: item.Name,
                            priority: Number(item.Priority),
                            domains: item.Domains.split(',').map(element=>element.trim()),
                            countries: item.Countries.split(',').map(element=>element.trim()),
                            country: item.Country,
                            categories: item.Categories.split(',').map(element=>element.trim()),
                            epc: parseFloat(item.EPC),
                            averageCommissionRate: parseFloat(item.Average_Commission_Rate),
                            averageBasketSize: parseFloat(item.Average_Basket_Size),
                            averageConversionRate: parseFloat(item.Average_Conversion_Rate),
                            specialRateType: item.Special_Rate_Type
                        }).catch(err => {
                            logger.log(err);
                        });
                    }    
                }).catch(err => {
                    logger.log(err);
                });    
        });
    });
};

module.exports = { run };
