const { ethers } = require("hardhat");

async function main(){

const TokenLockContract = await ethers.getContractFactory("TokenLock");
const tokenLockContract = await TokenLockContract.deploy(
);
const TokenLockContractAddress = await tokenLockContract.getAddress();

console.log("TokenLockContract Address:", TokenLockContractAddress)
console.log(" TokenLockContract contract deployed on", tokenLockContract.target);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });