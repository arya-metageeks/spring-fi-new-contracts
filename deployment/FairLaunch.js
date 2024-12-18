const { ethers } = require("hardhat");

async function main(){

const FairLaunch = await ethers.getContractFactory("FairLaunch");
const fairLaunch = await FairLaunch.deploy();
const fairLaunchAddress = await fairLaunch.getAddress();;

console.log("FairLaunch Address:", fairLaunchAddress)
// await FairLaunchD.deployed(); //wait for the contract to be deployed
console.log("FairLaunch contract deployed on", fairLaunch.target);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });