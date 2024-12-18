const { ethers } = require("hardhat");

async function main(){

const Airdrop = await ethers.getContractFactory("Airdrop");
const airdrop = await Airdrop.deploy();
const airdropAddress = await airdrop.getAddress();;

console.log("airdrop Address:", airdropAddress)
console.log("airdrop contract ARBI", airdrop.target);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });