const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deployment Configuration
  const config = {
    predefinedAddresses: {
      uniswapV2Router: "0x8136ae8a9d0eD82e7C607b500960a6B41e31EED7",
      tokenLockContract: "0x5FEE7a8c725ca7f8179F78acF58A8C906C9EEB9b"
    }
  };

  // 1. Deploy WETH9 (WMATIC)
  const WETH9Factory = await ethers.getContractFactory("WETH9");
  const weth = await WETH9Factory.deploy();
  await weth.waitForDeployment();
  const WMATIC = await weth.getAddress();
  console.log("WETH9/WMATIC deployed at:", WMATIC);

  // 2. Deploy UniswapV2Pair
  const UniswapV2PairFactory = await ethers.getContractFactory("UniswapV2Pair");
  const uniswapV2Pair = await UniswapV2PairFactory.deploy();
  await uniswapV2Pair.waitForDeployment();
  const uniswapV2PairAddress = await uniswapV2Pair.getAddress();
  console.log("UniswapV2Pair deployed at:", uniswapV2PairAddress);

  // 3. Deploy UniswapV2Factory
  const UniswapV2FactoryFactory = await ethers.getContractFactory("UniswapV2Factory");
  const uniswapV2Factory = await UniswapV2FactoryFactory.deploy(deployer.address);
  await uniswapV2Factory.waitForDeployment();
  const UniswapV2FactoryAddress = await uniswapV2Factory.getAddress();
  console.log("UniswapV2Factory deployed at:", UniswapV2FactoryAddress);

  // 4. Deploy UniswapV2FactoryETH
  const UniswapV2FactoryETHFactory = await ethers.getContractFactory("UniswapV2FactoryETH");
  const uniswapV2FactoryETH = await UniswapV2FactoryETHFactory.deploy(
    deployer.address,  // initial owner
    deployer.address,  // fee setter
    WMATIC             // WETH address
  );
  await uniswapV2FactoryETH.waitForDeployment();
  const uniswapV2FactoryETHAdd = await uniswapV2FactoryETH.getAddress();
  console.log("UniswapV2FactoryETH deployed at:", uniswapV2FactoryETHAdd);

  // 5. Deploy Subscription Contract
  const SubscriptionContractFactory = await ethers.getContractFactory("Subscription");
  const subscriptionContract = await SubscriptionContractFactory.deploy(
    UniswapV2FactoryAddress,
    config.predefinedAddresses.uniswapV2Router,
    uniswapV2FactoryETHAdd,
    WMATIC,
    config.predefinedAddresses.tokenLockContract
  );
  await subscriptionContract.waitForDeployment();
  const SubscriptionContractAddress = await subscriptionContract.getAddress();

  // Deployment Summary
  const deploymentSummary = {
    deployer: deployer.address,
    WMATIC: WMATIC,
    UniswapV2Pair: uniswapV2PairAddress,
    UniswapV2Factory: UniswapV2FactoryAddress,
    UniswapV2FactoryETH: uniswapV2FactoryETHAdd,
    UniswapV2Router: config.predefinedAddresses.uniswapV2Router,
    TokenLockContract: config.predefinedAddresses.tokenLockContract,
    SubscriptionContract: SubscriptionContractAddress
  };

  // Log deployment details
  console.log("\nDeployment Summary:");
  console.log("------------------");
  console.log("1. UniswapV2Factory:", UniswapV2FactoryAddress);
  console.log("2. UniswapV2Router:", config.predefinedAddresses.uniswapV2Router);
  console.log("3. UniswapV2FactoryETH:", uniswapV2FactoryETHAdd);
  console.log("4. WMATIC:", WMATIC);
  console.log("5. TokenLockContract:", config.predefinedAddresses.tokenLockContract);
  console.log("6. SubscriptionContract:", SubscriptionContractAddress);

  // Save deployment addresses to a file
  const deploymentPath = path.join(__dirname, '../deployment-addresses.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentSummary, null, 2));
  console.log("\nDeployment addresses saved to:", deploymentPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Comprehensive Deployment error:", error);
    process.exit(1);
  });