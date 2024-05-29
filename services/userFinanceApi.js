const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const moment = require('moment');

const API_HOST = process.env.PARTNERS_API_HOST;

const { api } = require('./api');
const db = require('../models/index');
const logger = require('./logger');

const intermediateFingerprint = process.env.FINGERPRINT || null;

const transportDataProof = require('../proofs/transportDataProof');
const transportCommissionDataProof = require('../proofs/transportCommissionDataProof');

const { checkSignedByUser, signByUser } = require('../utils/sign');

// eslint-disable-next-line no-async-promise-executor
const getReportForUserTrackerId = async (userTrackerId) => new Promise(async (resolve, reject) => {
  try {
    if(!userTrackerId) return null;

    const proof = Object.create(transportDataProof);
    proof.lengthOfParams = 1;
    proof.valuesOfParams = [userTrackerId]
    const signed = await signByUser(proof, intermediateFingerprint);

    const headers = {
        'Content-type': 'application/json',
        intermediateSign: signed,
        token: process.env.API_ACCESS_TOKEN || null
    };
    const params = undefined;
    const method = 'GET';
    const successCallback = (result) => {
      resolve(result);
    };
    const errorCallback = successCallback;
    const url = `${API_HOST}/commission-report?userId=${userTrackerId}`;
    const apiParams = {
      url,
      headers,
      params,
      method,
      successCallback,
      errorCallback
    };
    return api(apiParams).then(data => data);
  } catch (err) {
    logger.warning(`[userFinanceApi] getReportForUserTrackerId ${err?.message}`, err);
    return reject(err);
  }
});

const getUserCommissionInfo = (userTrackerId) => new Promise((resolve, reject) => {
  try {
    getReportForUserTrackerId(userTrackerId).then(async (results) => {
      if(results?.status === 200) {
        const sign = results?.headers?.intermediatesign;
        const proof = Object.create(transportCommissionDataProof);          
        proof.lengthOfRecords = results?.data?.length || 0;
        proof.sumOfOrdersAmount = results?.data?.reduce((a,b) => a+b?.transactionDetails?.orderAmount,0) || 0;
        const signed = await checkSignedByUser(proof, intermediateFingerprint, sign);
        if(signed)  {
          return resolve(results?.data);
        }
        const error = new Error('[getReportForUserTrackerId] Transfer wrong signed token');
        return reject(error);
      } 
      const error = new Error(`[getReportForUserTrackerId] Wrong http status, ${JSON.stringify(results)}`);
      return reject(error);
    })
  } catch (err) {
    const e = `[getReportForUserTrackerId] getUserCommissionInfo catch ${err?.message}`;
    logger.warning(`[userFinanceApi] getUserCommissionInfo catch ${err?.message}`, err);
    reject(e)
  }
});

const setWithdrawForTransactionId = (transactionId) => new Promise(async (resolve, reject) => {
  if(!transactionId) return null;

  try {
      const proof = Object.create(transportDataProof);
      proof.lengthOfParams = 2;
      proof.valuesOfParams = [transactionId, 'done'];
      const signed = await signByUser(proof, intermediateFingerprint);

      const headers = {
          'Content-type': 'application/json',
          intermediateSign: signed,
          token: process.env.API_ACCESS_TOKEN || null
      };

      const params = undefined;
      const method = 'PUT';
      const successCallback = (result) => {
          resolve(result);
          return result;
      };
      const errorCallback = successCallback;
      const url = `${API_HOST}/commission-report?transactionId=${transactionId}&status=done`;
      const apiParams = {
          url,
          headers,
          params,
          method,
          successCallback,
          errorCallback
      };
      return api(apiParams).then(data => data);
  } catch (err) {
      logger.error(`[userFinanceApi] issue when setWithdrawForTransactionId ${transactionId}`, err);
      reject(err);
      return err;
  };
});

const setWithdraw = (transactionId) => new Promise((resolve, reject) => {
  try {
    setWithdrawForTransactionId(transactionId).then((results) => {
      if(results?.status === 200) {
        resolve(results?.data);
      } else {
        resolve([]);
      }
    })
  } catch (err) {
    logger.warning(`[userFinanceApi] setWithdraw ${err?.message}`, err);
    reject(err)
  }
});

const setWithdrawReferral = (transactionId) => new Promise((resolve, reject) => {
  try {
    db.models.Withdraw.updateOne({_id: transactionId}, {done: moment().toDate()}).exec().then((updated) => {
      resolve(updated)
    })
  } catch (err) {
    logger.warning(`[userFinanceApi] issue when setWithdrawReferral for transaction id ${transactionId}, ${err?.message}`, err)
    reject(err)
  }
});

module.exports = { 
  getUserCommissionInfo,
  setWithdraw, 
  setWithdrawReferral 
};