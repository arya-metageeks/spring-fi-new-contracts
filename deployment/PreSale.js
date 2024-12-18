const { ethers } = require("hardhat");

async function main(){

const Presale = await ethers.getContractFactory("Presale");
const presale = await Presale.deploy("0x5FEE7a8c725ca7f8179F78acF58A8C906C9EEB9b");
const presaleAddress = await presale.getAddress();;

console.log("Presale Address:", presaleAddress)
console.log("Presale contract ARBI", presale.target);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });