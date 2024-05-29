const fs = require('fs');
const db = require('../models/index');

const LOGOS_PATH = '/assets';
const LOGOS_PATH_COPY_TO = '/assets/images/stores/';

const updateLogo = () => {
  
    const filenames = fs.readdirSync(`${__dirname}${LOGOS_PATH}`);
  
    filenames.forEach(async(file) => {
        const f = file.split('.');
        switch(f[2]) {
            case 'com_result' : f[2] = 'com'; break;
            case 'ca_result' : f[2] = 'ca'; break;
            case 'net_result' : f[2] = 'net'; break;
            default : f[2] = f[2] ? f[2] : 'other_result';
        };
        const copyFile = `${f[1]}.${f[2]}.png`;
        fs.copyFileSync( `${__dirname}${LOGOS_PATH}/${file}`, `${__dirname}${LOGOS_PATH_COPY_TO}${copyFile}`);
        const filter = {
            domain: `${f[1]}.${f[2]}`
        };
        const update = {
            logo: `assets/images/stores/${copyFile}`
        };
        db.models.Stores.updateOne(filter, update).exec();
    });      
}

module.exports = {
    updateLogo
}