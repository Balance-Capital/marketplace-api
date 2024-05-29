const { validationResult } = require('express-validator');
const moment = require('moment');

const {
  RESPONSE_STATUS_OK,
  RESPONSE_STATUS_WRONG_PARAMS,
  RESPONSE_STATUS_CONFLICT_REQUEST,
  RESPONSE_STATUS_UNAUTHORIZED
} = require('../constants/httpResponse');

const db = require('../models/index');
const WalletResponse = require('../response/WalletResponse');

const getAllWalletsForUser = async (userId) => (!userId)
    ? null
    : db.models.Wallets.find({userId, deletedAt: null}).exec()
        .then((wallets) => wallets.map((item) => WalletResponse(item)))

const getAll = async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
  };

  const userId = req?.user?.id || null;
  return (!userId)
    ? res.status(RESPONSE_STATUS_UNAUTHORIZED).json({})
    : db.models.Wallets.find({userId, deletedAt: null}).exec()
        .then((wallets) => res.status(RESPONSE_STATUS_OK).json(wallets.map((item) => WalletResponse(item))))
}

const setDefault = async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
  };

  const {walletAddress} = req.body;
  const userId = req?.user?.id || null;
  if (!userId) return res.status(RESPONSE_STATUS_UNAUTHORIZED).json({});

  return db.models.Wallets.findOne({userId, default: true},{address:1}).exec().then((wallet) => 
    db.models.Wallets.updateMany({userId},{
      $set: {
        default: false
      }
    })
    .exec()
    .then(() => db.models.Wallets.updateOne({walletAddress},{default: true, lastAddress: wallet.walletAddress})
      .exec()
      .then((result) => res.status(RESPONSE_STATUS_OK).json({setDefault: !!result?.modifiedCount || null }))))
}

const addNewOne = async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
  };

  const { walletAddress, walletName } = req.body;
  const lastIp = req?.connection?.remoteAddress || null;
  const userId = req?.user?.id || null;
  if (!userId) return res.status(RESPONSE_STATUS_UNAUTHORIZED).json({});

  const document = {
    walletAddress,
    walletName,
    lastIp,
    userId
  };

  return db.models.Wallets.find({walletAddress}).exec().then(async (result) => {
    if(result.length > 0) {
      if(result[0].deletedAt) {
        await db.models.Wallets.updateOne({walletAddress}, {deletedAt:null}).then((newWallet) => (newWallet));
        return res.status(RESPONSE_STATUS_OK).json({deleted: true })
      }
    }
    return db.models.Wallets.insertMany(document).then((newWallet) => (newWallet) 
      ? res.status(RESPONSE_STATUS_OK).json(WalletResponse(newWallet))
      : res.status(RESPONSE_STATUS_CONFLICT_REQUEST).json(newWallet)
    )
  })
}

const deleteOne = async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(RESPONSE_STATUS_WRONG_PARAMS).json({ errors: errors.array() });
  };

  const { walletAddress } = req.query;
  const lastIp = req?.connection?.remoteAddress || null;
  const userId = req?.user?.id || null;
  if (!userId) return res.status(RESPONSE_STATUS_UNAUTHORIZED).json({});

  return db.models.Wallets.updateOne({walletAddress},{
    deletedAt: moment().toDate(),
    lastIp
  }).exec().then((result) => res.status(RESPONSE_STATUS_OK).json({deleted: !!result?.modifiedCount || null }))
}

module.exports = { 
  getAll,
  addNewOne,
  deleteOne,
  setDefault,
  getAllWalletsForUser
};