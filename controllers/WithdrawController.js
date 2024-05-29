/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
const os = require('os');
const { validationResult } = require('express-validator');
const { ObjectId } = require('bson');
const moment = require('moment');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS,
  RESPONSE_STATUS_CONFLICT_REQUEST,
  RESPONSE_STATUS_ERROR
} = require('../constants/httpResponse');

const {
  REFERRALS_STATUS_DONE
} = require('../constants/referralsStatus');

const { BALANCE_OPERATION_WITHDRAW } = require('../constants/user');

const { getUserCommissionInfo, setWithdraw, setWithdrawReferral } = require('../services/userFinanceApi');
const logger = require('../services/logger');

const {   
  createMerkleTree,
  // getMerkleTreeRoot,
  getMerkleTreeProof,
  setMerkleTreeRootToContract
} = require ('../services/merkle');

const db = require('../models/index');

const { signByServer, checkSignedByServer } = require('../utils/sign');
const withdrawProof = require('../proofs/withdrawProof');
const { decrypt } = require('../utils/encrypt_decrypt');

// eslint-disable-next-line consistent-return
const changeBalance = async (record) => {
  try {
    const amountOperation = record.amount; 
    const userId = await db.models.Wallets.findOne({
      walletAddress: record.toAddress
    }).then((user) => user?.userId || null); 
    if(!userId) {
      logger.error('changeBalance: null on userId');
      return null;
    }
    const operationType = BALANCE_OPERATION_WITHDRAW;
    const operationDate = moment().toDate();
    db.models.Users.changeBalance(
        amountOperation,
        userId,
        operationType,
        operationDate
    )  
  } catch(error) {
    logger.warning(`[WithdrawController] ${error?.message}`, error)
  }
};

const merkleOperation = async (records) => {
  try {
    const ethRpcUrl = process.env.ETH_RPC_URL;
    const distributorPrivateKey = process.env.MERKLE_DISTRIBUTOR_PRIVATE_KEY;
    const distributorAddress = process.env.MERKLE_DISTRIBUTOR_ADDRESS;
        
    const merkleTreeRoot = await createMerkleTree(records).catch((error) => logger.error(error));
  
    const validate = await getMerkleTreeProof(merkleTreeRoot, records).catch((error) => logger.error(error));
  
    if(validate) {
      await setMerkleTreeRootToContract(ethRpcUrl, distributorPrivateKey, distributorAddress, merkleTreeRoot)
        .catch((err) => logger.error(err));
    };
  
  } catch(error) {
    logger.warning(`[WithdrawController] ${error?.message}`, error)
  }

}

const withdrawn = () => {
  try {  
    const groupsWithdraw = [];
    db.models.Withdraw.find({done: null}).exec().then(async(records) => {
      for (const record of records) {

        if(record.referralTransactionId) {
          await setWithdrawReferral(record.referralTransactionId).then(async() => {
            const signed = record.signed[0]?.value || null;
            const proof = Object.create(withdrawProof);
            proof.amount = record?.amount;
            proof.currency =  record?.currency;        
            proof.fromAddress = record?.fromAddress;
            proof.toAddress = record?.toAddress;
            const sign = await checkSignedByServer(proof, signed);
            if(sign) {
              groupsWithdraw.push(record);
              await db.models.Withdraw.updateOne({_id: record._id}, { done: moment().toDate()}).exec()
                .then(() => changeBalance(record))
                .catch((error) => logger.error(error));  
            };

          }).catch((error) => logger.error(error));
        };

        if(record.transactionId && !record.referralTransactionId) {
          await setWithdraw(record.transactionId).then(async (rec) => {
            const publisherAmountString = +decrypt(rec?.transactionDetails?.publisherAmountString);
            const publisherAmount = rec?.transactionDetails?.publisherAmount;
            if (publisherAmount !== publisherAmountString) {
              logger.critical(`[WithdrawController] attempted fraud, publisherAmount: ${publisherAmount}, publisherAmountString: ${publisherAmountString}`);
              return;
            };
            const signed = record.signed[0]?.value || null;
            const proof = Object.create(withdrawProof);
            proof.amount = rec?.transactionDetails?.publisherAmount;
            proof.currency =  record?.currency;        
            proof.fromAddress = record?.fromAddress;
            proof.toAddress = record?.toAddress;
            const sign = await checkSignedByServer(proof, signed);
            if(sign) {
              groupsWithdraw.push({
                to: proof.toAddress,
                token: proof.currency,
                amount: proof.amount,
                transactionId: record.transactionId,
                referralTransactionId: record.referralTransactionId
              });
              await db.models.Withdraw.updateOne({_id: record._id}, { done: moment().toDate()}).exec()
                .then(() => changeBalance(proof))
                .catch((error) => logger.warning(`[WithdrawController] mongo withdraw update ${error?.message}`,error));  
            };
            
          }).catch((error) => logger.warning(`[WithdrawController] catch withdrawn method ${error?.message}`, error));
        };

      };
      if(groupsWithdraw.length > 0) {
        await merkleOperation(groupsWithdraw).catch((error) => logger.warning(`[WithdrawController] merkleOperation ${error?.message}`,error));
      };
    });
  } catch(error) {
    logger.warning(`[WithdrawController] withdraw method ${error?.message}`, error);
  };
};

const create = async(req, res) => {
  try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
    };
    
    const user = await db.models.Users.findOne({_id: new ObjectId(req?.user?.id)});
  
    const fromAddress =  process.env.MERKLE_DISTRIBUTOR_ADDRESS || null;
    const toAddress = await db.models.Wallets.findOne({userId: user.id, default: true}).exec().then((result) => result?.walletAddress || null);
  
    if(!fromAddress || !toAddress) {
      return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({})
    }
  
    const commissionReports = await getUserCommissionInfo(user.cookieId[0]);
  
    const referralReports = await db.models.Referrals.find({referral: user.referralId, status: REFERRALS_STATUS_DONE}).exec();
  
    if(referralReports?.length > 0) {
      for (const referralReport of referralReports) {
        const {currency, amount} = referralReport;
        
        const proof = Object.create(withdrawProof);
        proof.amount = amount;
        proof.currency = currency;
        proof.fromAddress = fromAddress;
        proof.toAddress = toAddress;
        const signed = await signByServer(proof);
        
        const { transactionId } = referralReport;
        const referralTransactionId = referralReport._id.toString();
      
        const document = {
          fromAddress,
          toAddress,
          currency,
          amount,
          transactionId,
          referralTransactionId,
          signed: [{
            timestamps: moment().toDate(),
            value: signed,
            name: os.hostname()
          }]
        };
  
        const exists = await db.models.Withdraw.findOne({referralTransactionId: document.referralTransactionId}).exec();
        if(exists) return res.status(RESPONSE_STATUS_CONFLICT_REQUEST).json({});
  
        await db.models.Withdraw.insertMany(document);
      };
    };
  
    if(commissionReports?.length > 0) {
      for (const commissionReport of commissionReports) {
        const {currency, publisherAmount, publisherAmountString} = commissionReport.transactionDetails;
        const publisherAmountStringDecrypt = +decrypt(publisherAmountString);
        if (publisherAmountStringDecrypt !== publisherAmount) {
          logger.critical(`[WithdrawController] attempted fraud, publisherAmountStringDecrypt: ${publisherAmountStringDecrypt}, publisherAmount: ${publisherAmount}, userId: ${user.id}`, commissionReport)
          return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({})
        };
        const proof = Object.create(withdrawProof);
        proof.amount = publisherAmount;
        proof.currency = currency;
        proof.fromAddress = fromAddress;
        proof.toAddress = toAddress;
        const signed = await signByServer(proof);
  
        const transactionId = commissionReport._id;
        const referralTransactionId = null;
  
        const document = {
          fromAddress,
          toAddress,
          currency,
          publisherAmount,
          transactionId,
          referralTransactionId,
          signed: [{
            timestamps: moment().toDate(),
            value: signed,
            name: os.hostname()
          }]
        };
  
        const exists = await db.models.Withdraw.findOne({transactionId, referralTransactionId}).exec();
        if(exists) return res.status(RESPONSE_STATUS_CONFLICT_REQUEST).json({});
      
        await db.models.Withdraw.insertMany(document);
      };
    };
  
    return res.status(RESPONSE_STATUS_OK).json({});
  
  } catch(error) {
    logger.warning(`[WithdrawController] create method fail ${error?.message}`, error)
    return res.status(RESPONSE_STATUS_ERROR).json({});
  }
}

module.exports = { 
  create,
  withdrawn
};