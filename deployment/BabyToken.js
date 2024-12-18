const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment process...");

  const BabyToken = await ethers.getContractFactory("BabyTokenFactoryV3");
  const babyToken = await BabyToken.deploy();
  const babyTokenAddress = await babyToken.getAddress();

  console.log("BabyToken Address:", babyTokenAddress);
  // await FairLaunchD.deployed(); //wait for the contract to be deployed
  console.log("BabyToken contract deployed on", babyToken.target);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
