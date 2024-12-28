require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // defaultNetwork: "localhost",

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    sepolia: {
      url: "https://rpc.sepolia.org", // Ethereum Sepolia RPC URL
      accounts: [process.env.MASTER_PRIVATE_KEY_TESTNET], // Deployment wallet private key for Sepolia
      chainId: 11155111, // Sepolia chain ID
    },

    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: [process.env.ARBI_SEPOLIA_PVT_KEY], 
    },

    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [process.env.MASTER_PRIVATE_KEY], 
      chainId: 42161, // Arbitrum One chain ID
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARBISCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY
    },
  },
};

// npx hardhat verify --network arbitrumSepolia 0x24E56b54aAce58D9d5e3297e1DDFeaA29FAf2635

