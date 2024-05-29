const ethers = require('ethers');
const MerkleTree = require('merkletreejs');
const keccak256 = require('keccak256');
const logger = require("./logger");

const MERKLE_DISTRIBUTOR_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_setter',
        type: 'address'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'Claimed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'merkleRoot',
        type: 'bytes32'
      }
    ],
    name: 'MerkleRootUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'allocation',
        type: 'uint256'
      },
      {
        internalType: 'bytes32[]',
        name: 'merkleProofs',
        type: 'bytes32[]'
      }
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'tokens',
        type: 'address[]'
      },
      {
        internalType: 'uint256[]',
        name: 'allocations',
        type: 'uint256[]'
      },
      {
        internalType: 'bytes32[][]',
        name: 'merkleProofs',
        type: 'bytes32[][]'
      }
    ],
    name: 'claimInBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'claimedAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'merkleRoot',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'recoverToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_merkleRoot',
        type: 'bytes32'
      }
    ],
    name: 'setMerkleRoot',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_setter',
        type: 'address'
      }
    ],
    name: 'setSetter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'setter',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    stateMutability: 'payable',
    type: 'receive'
  }
];

const createMerkleTree = async (dataArray) => {
  // here I assume the data has `to`, `token`, `amount` fields

  const leaves = dataArray.map((data) =>
    ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'address', 'uint256'],
        [data.to, data.token, data.amount]
      )
    )
  );

  return new MerkleTree(leaves, keccak256, {
    sortPairs: true
  });
};

const getMerkleTreeRoot = (merkleTree) => merkleTree.getRoot();

const getMerkleTreeProof = (merkleTree, data) => {
  // here I assume the data has `to`, `token`, `amount` fields
  const leaf = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['address', 'address', 'uint256'],
      [data.to, data.token, data.amount]
    )
  );

  return merkleTree.getHexProof(leaf);
};

const setMerkleTreeRootToContract = async (
  ethRpcUrl,
  distributorPrivateKey,
  distributorAddress,
  merkleTreeRoot
) => {
  const provider = new ethers.providers.JsonRpcProvider(ethRpcUrl);
  const signer = new ethers.Wallet(distributorPrivateKey, provider);
  const merkleDistributorContract = new ethers.Contract(
    distributorAddress,
    MERKLE_DISTRIBUTOR_ABI,
    signer
  );

  const tx = await merkleDistributorContract.setMerkleRoot(merkleTreeRoot);
  await tx.wait(1);

  logger.log('transaction to set merkle tree root, tx: ', tx.hash);
};

module.exports = {
  createMerkleTree,
  getMerkleTreeRoot,
  getMerkleTreeProof,
  setMerkleTreeRootToContract
};
