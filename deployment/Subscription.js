const { ethers } = require("hardhat");

async function main(){

const uniswapV2Factory = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32"
const uniswapV2Router = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"
const uniswapV2RouterETH = "0x8954AfA98594b838bda56FE4C12a09D7739D179b"
const WMATIC ="0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"
const TokenLockContract = "0xf1495036db47f8A5E4a29F45969E21e180b2FEc4"

const SubscriptionContract = await ethers.getContractFactory("Subscription");
const subscriptionContract = await SubscriptionContract.deploy(
    uniswapV2Factory,
    uniswapV2Router,
    uniswapV2RouterETH,
    WMATIC,
    TokenLockContract
);

const SubscriptionContractAddress = await subscriptionContract.getAddress();

console.log("SubscriptionContract Address:", SubscriptionContractAddress)
console.log("SubscriptionContract contract deployed on", subscriptionContract.target);

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });