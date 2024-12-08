// require("@nomicfoundation/hardhat-toolbox");
// require("dotenv").config();
// require('@openzeppelin/hardhat-upgrades');

// module.exports = {
//   solidity: "0.8.20",  // Use your solidity version
//   // networks: {
//   //   arbitrumTestnet: {
//   //     url: process.env.ARBITRUM_RPC,  // Your Arbitrum testnet RPC URL
//   //     accounts: [process.env.MASTER_PRIVATE_KEY],     // Your deployment wallet private key
//   //     chainId: 42161                         // Arbitrum Goerli chainId
//   //   }
//   // }
// };

require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: [process.env.MASTER_PRIVATE_KEY_TESTNET], 
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
    },
  },
  solidity: {
    version: "0.8.27", 
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

// npx hardhat verify --network arbitrumSepolia 0xDef487850caB4e931a4b94D330C77130ef173039
// 0x439DB1cE45b6392d5Aa8D1f59C9de4e81E8263dE

