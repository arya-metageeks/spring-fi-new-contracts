const { ethers } = require("hardhat");

async function main(){

const BuyBabyToken = await ethers.getContractFactory("BuybackBabyTokenFactoryV3");
const buyBabyToken = await BuyBabyToken.deploy();
const babyTokenAddress = await buyBabyToken.getAddress();

console.log("BuyBabyToken Address:", babyTokenAddress)
// await FairLaunchD.deployed(); //wait for the contract to be deployed
console.log("BuyBabyToken contract deployed on", buyBabyToken.target);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });