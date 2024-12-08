const { ethers } = require("hardhat");

async function main(){

const AuctionD = await ethers.getContractFactory("AuctionD");
const auctionD = await AuctionD.deploy();
const auctionDAddress = await auctionD.getAddress();
const txHash = auctionD.deploymentTransaction();
console.log("Deployment transaction hash:", txHash);

console.log("Auction Address:", auctionDAddress)
// await FairLaunchD.deployed(); //wait for the contract to be deployed
console.log("AuctionD contract deployed on", auctionD.target);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });