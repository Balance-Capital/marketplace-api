/* eslint-disable no-console */
require('dotenv').config();
const axios = require('axios');
const { RESPONSE_STATUS_REFUSED } = require('../constants/httpResponse');
const logger = require('./logger');

const api = async ({
  url,
  headers,
  params,
  method,
  successCallback,
  errorCallback
}) => {
  const options = {
    method: method || 'get',
    headers,
    url,
    data: params
  };
  return axios(options)
    .catch((error) => {
      if (error && error.code === RESPONSE_STATUS_REFUSED) {
        if (errorCallback) errorCallback(error);
        if(process.env.HTTP_API_DEBUG === 'true') {
          logger.log(options);
          logger.log(error.code);  
        }
        logger.critical(`API: ${error}`);
      } else if (error && error.response && error.response.status === 500) {
        if (errorCallback) errorCallback(error);
        if(process.env.HTTP_API_DEBUG === 'true') {
          logger.log(options);
          logger.log(error.response.status);
        }
        logger.critical(`API: ${error}`);
      } else {
        if (errorCallback) errorCallback(error);
        if(process.env.HTTP_API_DEBUG) {
          logger.log(error);
        }
        logger.warning(`API: ${error}`);
      }
      return false;
    })
    .then((response) => {
      if(!response.status) {
        if(errorCallback) errorCallback();
      }
      if(process.env.HTTP_API_DEBUG === 'true') {
        logger.log('---------');
        logger.log('REQUEST OPTION');
        logger.log(options.url);        
        logger.log(options.method);        
        logger.log(options.headers);        
        logger.log('RESPONSE');
        logger.log(`STATUS: ${response.status}`);
        logger.log(`HEADERS:`);
        logger.log(response.headers);
      };
      if (successCallback) successCallback(response);
      return response;
    });
};

module.exports = { api };
