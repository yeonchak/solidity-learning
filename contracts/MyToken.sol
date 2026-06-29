// Token : smart contract based
// BIT, ETH, XRP, KAIA : native token

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MyToken {
    string public name;
    string public symbol;
    uint8 public decimals; // uint8 --> 8 bit unsigned int, uint16, ... , uint256

    uint256 public totalSupply; // 전체 몇개를 발행했느냐
    mapping(address => uint256) public balanceOf; // 누가 얼마를 가지고 있느냐

    constructor(string memory _name, string memory _symbol, uint8  _decimal){
        name = _name;
        symbol = _symbol;
        decimals = _decimal;
        // transaction
        // from, to, date, value, gas, ...
        _mint(1*10**uint256(decimals), msg.sender); // 1MT
    }

    function _mint(uint256 amount, address owner) internal {
        totalSupply += amount;
        balanceOf[owner] += amount;
    }

    // function totalSupply() external view returns (uint256) { // external : 외부에서만 호출 가능, view : 읽기전용
    //     return totalSupply;
    // }
 
    // function balanceOf(address owner) external view returns (uint256){
    //     return balanceOf[owner];
    // }
 
    // function name() external view returns(stirng memory) {
    //     return name;
    // }
}