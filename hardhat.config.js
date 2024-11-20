require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // For environment variables

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
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", // Local Hardhat network
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "", // RPC URL for Sepolia
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], // Your private key
      chainId: 11155111, // Chain ID for Sepolia
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "", // For verifying contracts
  },
};
