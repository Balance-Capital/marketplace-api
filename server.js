require('dotenv').config();
const os = require("os");
const cluster = require("cluster");

const PORT = process.env.APP_PORT || 3000;
const RATIO = 1;
const CLASTER_MIN_SIZE = 100;
const CURRENT_CLUSTER_SIZE = os.cpus().length * RATIO;

const logger = require('./services/logger');
const app = require('./app');

if (CURRENT_CLUSTER_SIZE > CLASTER_MIN_SIZE) {
  if (cluster.isMaster) {

    for (let i=0; i < CURRENT_CLUSTER_SIZE; i+=1) {
      cluster.fork();
    };

    cluster.on('exit', (worker) => {
      logger.info(`Worker, ${worker.id}, has exitted.`);
    });

    
  } else {

    app.listen(PORT, () => logger.info(`API server listening on port ${PORT} and worker ${process.pid}`));

  };
} else {

  app.listen(PORT, () => logger.info(`API server listening on port ${PORT} with the single worker ${process.pid}`));
    
};

module.exports = app;