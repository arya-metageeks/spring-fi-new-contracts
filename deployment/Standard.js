const { ethers } = require("hardhat");

async function main(){

const StandardToken = await ethers.getContractFactory("StandardTokenFactory");
const standardToken = await StandardToken.deploy();
const babyTokenAddress = await standardToken.getAddress();

console.log("StandardToken Address:", babyTokenAddress)
// await FairLaunchD.deployed(); //wait for the contract to be deployed
console.log("StandardToken contract deployed on", standardToken.target);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });