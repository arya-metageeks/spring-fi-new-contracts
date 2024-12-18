const hre = require("hardhat");

async function main() {
  // Get the deploying account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Deploy WETH9 Contract
  const WETH9 = await hre.ethers.getContractFactory("WETH9");
  const weth = await WETH9.deploy();
  const wethAddress = await weth.getAddress()
  console.log("WETH9 deployed to:",wethAddress);

  // Deploy ArbitrumFactory
  const ArbitrumFactory = await hre.ethers.getContractFactory("ArbitrumFactory");
  const factory = await ArbitrumFactory.deploy(deployer.address);
  const arbiFactoryAddress = await factory.getAddress()

  console.log("ArbitrumFactory deployed to:",arbiFactoryAddress);

  // Deploy ArbitrumRouter
  const ArbitrumRouter = await hre.ethers.getContractFactory("ArbitrumRouter");
  const router = await ArbitrumRouter.deploy(arbiFactoryAddress,wethAddress);
  const routerAddress = await router.getAddress()
  console.log("ArbitrumRouter deployed to:", routerAddress);

}

// Deployment function
async function deployCustomRouter() {
  try {
    const { weth, factory, router } = await main();
    return { weth, factory, router };
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

// Export the deployment function
module.exports = {
  deployCustomRouter,
  main
};

// Run the deployment if this script is executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}