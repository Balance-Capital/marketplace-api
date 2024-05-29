const find = require('find-process');
const { pid } = require('process');
const db = require('../models/index');

const closeProcessName = () => {
    find('pid', pid).then(processList => {
        db.models.LogProcess.deleteOne({
            pid: processList[0].pid
        }).exec().then(()=>{
            process.exit();
        });    
    });
};

const getProcessName = (processName) => new Promise( (resolve, reject) => {
    try {

        db.models.LogProcess.findOne({name:processName}).exec().then(processExist => {
            if(!processExist) {
                db.models.LogProcess.insertMany([{
                    name:processName,
                    pid
                }]).then(() => {
                    resolve(true);
                });
            } else {
                resolve(false);
            };
        });
    
    } catch (err) {
        reject(err);
    };
});

module.exports = {
    getProcessName,
    closeProcessName
};