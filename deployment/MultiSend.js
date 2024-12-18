const { ethers } = require("hardhat");

async function main(){

const MultiSend = await ethers.getContractFactory("MultiSend");
const multiSend = await MultiSend.deploy();
const multiSendAddress = await multiSend.getAddress();;

console.log("multiSend Address:", multiSendAddress)
console.log("multiSend contract ARBI", multiSend.target);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });