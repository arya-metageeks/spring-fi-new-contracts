// // SPDX-License-Identifier: MIT
// pragma solidity 0.8.4;

// import "./Liquidity.sol";

// contract LiquidityGeneratorFactory {
//     function createToken(
//         string memory name_,
//         string memory symbol_,
//         uint256 totalSupply_,
//         address router_,
//         address charityAddress_,
//         uint16 taxFeeBps_,
//         uint16 liquidityFeeBps_,
//         uint16 charityFeeBps_,
//         address serviceFeeReceiver_,
//         uint256 serviceFee_
//     ) external payable returns (address) {
//         LiquidityGeneratorToken newToken = new LiquidityGeneratorToken(
//             name_,
//             symbol_,
//             totalSupply_,
//             router_,
//             charityAddress_,
//             taxFeeBps_,
//             liquidityFeeBps_,
//             charityFeeBps_,
//             serviceFeeReceiver_,
//             serviceFee_
//         );
//         newToken.transfer(msg.sender, newToken.balanceOf(address(this)));
//         newToken.transferOwnership(payable(msg.sender));
//         return address(newToken);
//     }
// }
