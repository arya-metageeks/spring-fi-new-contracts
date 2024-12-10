const { ethers } = require("hardhat");

async function main(){

const BabyToken = await ethers.getContractFactory("BabyTokenFactory");
const babyToken = await BabyToken.deploy();
const babyTokenAddress = await babyToken.getAddress();
const txHash = babyToken.deploymentTransaction();
console.log("Deployment transaction hash:", txHash);

console.log("BabyToken Address:", babyTokenAddress)
// await FairLaunchD.deployed(); //wait for the contract to be deployed
console.log("BabyToken contract deployed on", babyToken.target);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });