const cron = require('cron');
const {
    withdrawn
} = require('../controllers/WithdrawController')

const cronSchedule = new cron.CronJob('0 0 */12 * * *', async () => {
    withdrawn();
});

if(process.argv[2] === 'start') {
    cronSchedule.start();
};

if(process.argv[2] === 'stop') {
    cronSchedule.stop()
};