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



const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LiquidityGeneratorToken", function () {
  let LiquidityGeneratorTokenFactory;
  let factory;
  let token;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let router;
  let weth;

  const TOKEN_NAME = "Test Token";
  const TOKEN_SYMBOL = "TEST";
  const TOTAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  const TAX_FEE = 200; // 2%
  const LIQUIDITY_FEE = 300; // 3%
  const CHARITY_FEE = 100; // 1%
  const SERVICE_FEE = ethers.parseEther("0.1"); // 0.1 ETH

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, charityAddress, serviceFeeReceiver, ...addrs] = await ethers.getSigners();

    // Deploy mock WETH and Router
    const WETH = await ethers.getContractFactory("MockERC20");
    weth = await WETH.deploy("Wrapped ETH", "WETH");
    await weth.waitForDeployment();

    // Deploy mock Router
    const Router = await ethers.getContractFactory("MockRouter");
    router = await Router.deploy(await weth.getAddress());
    await router.waitForDeployment();

    // Deploy Factory
    LiquidityGeneratorTokenFactory = await ethers.getContractFactory("LiquidityGeneratorTokenFactory");
    factory = await LiquidityGeneratorTokenFactory.deploy();
    await factory.waitForDeployment();
  });

  describe("Token Creation", function () {
    it("Should create a new token with correct parameters", async function () {
      // Get initial balances
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const initialServiceFeeReceiverBalance = await ethers.provider.getBalance(serviceFeeReceiver.address);

      // Create token with more explicit parameters
      const tx = await factory.createToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        TOTAL_SUPPLY,
        await router.getAddress(),
        charityAddress.address,
        TAX_FEE,
        LIQUIDITY_FEE,
        CHARITY_FEE,
        serviceFeeReceiver.address,
        SERVICE_FEE,
        {
          value: SERVICE_FEE,
          gasLimit: 5000000
        }
      );

      const receipt = await tx.wait();
      console.log("Recei")
      // // Find TokenCreated event
      // const event = receipt.events.find(e => e.event === "TokenCreated");
      // expect(event, "TokenCreated event not found").to.not.be.undefined;
      
      // const tokenAddress = event.args.token;
      // token = await ethers.getContractAt("LiquidityGeneratorToken", tokenAddress);

      // Verify token parameters
      // expect(await token.name()).to.equal(TOKEN_NAME);
      // expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
      // expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY);
      // expect(await token.owner()).to.equal(owner.address);
      
      // Verify fees were correctly set
      // expect(await token.taxFeeBps()).to.equal(TAX_FEE);
      // expect(await token.liquidityFeeBps()).to.equal(LIQUIDITY_FEE);
      // expect(await token.charityFeeBps()).to.equal(CHARITY_FEE);
      
      // Verify service fee transfer
      const finalServiceFeeReceiverBalance = await ethers.provider.getBalance(serviceFeeReceiver.address);
      expect(finalServiceFeeReceiverBalance - initialServiceFeeReceiverBalance).to.equal(SERVICE_FEE);
    });

    it("Should verify factory state before token creation", async function() {
      const factoryAddress = await factory.getAddress();
      const isContract = await ethers.provider.getCode(factoryAddress);
      expect(isContract).to.not.equal("0x");
      
      const isTokenCreated = await factory.isTokenCreated(ethers.ZeroAddress);
      expect(isTokenCreated).to.be.false;
    });
  });
});