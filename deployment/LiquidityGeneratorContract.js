const { ethers } = require("hardhat");

async function main(){

const LiquidityGeneratorTokenFactory = await ethers.getContractFactory("LiquidityGeneratorTokenFactory");
const liquidityGeneratorTokenFactory = await LiquidityGeneratorTokenFactory.deploy();
const liquidityGeneratorTokenFactoryAddress = await liquidityGeneratorTokenFactory.getAddress();
// const txHash = liquidityGeneratorTokenFactory.deploymentTransaction();
// console.log("Deployment transaction hash:", txHash);

console.log("liquidityGeneratorTokenFactory Address:", liquidityGeneratorTokenFactoryAddress)
console.log("liquidityGeneratorTokenFactory contract deployed on", liquidityGeneratorTokenFactory.target);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });