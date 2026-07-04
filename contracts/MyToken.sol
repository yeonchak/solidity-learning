// Token : smart contract based
// BIT, ETH, XRP, KAIA : native token

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MyToken {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed spender, uint256 amount);

    string public name;
    string public symbol;
    uint8 public decimals; // uint8 --> 8 bit unsigned int, uint16, ... , uint256

    uint256 public totalSupply; // 전체 몇개를 발행했느냐
    mapping(address => uint256) public balanceOf; // 누가 얼마를 가지고 있느냐
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimal, uint256 _amount){
        name = _name;
        symbol = _symbol;
        decimals = _decimal;
        // transaction
        // from, to, date, value, gas, ...
        _mint(_amount * 10 ** uint256(decimals), msg.sender); // 1MT
    }

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
        emit Approval(spender, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external {
        address spender = msg.sender;
        require(allowance[from][spender] >= amount, "insufficient allowance");
        allowance[from][spender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function mint(uint256 amount, address owner) external{
        _mint(amount, owner);
    } // 취약점 보완 필요 by modifier

    function _mint(uint256 amount, address owner) internal {
        totalSupply += amount;
        balanceOf[owner] += amount;

        emit Transfer(address(0), owner, amount);
    }

    function transfer(uint256 amount, address to) external{
        require(balanceOf[msg.sender] >= amount, "insufficient balance"); // 어떤 문제로 거래가 실패했는지 알 수 있음

        balanceOf[msg.sender] -= amount; // state 변경으로 gas 발생
        balanceOf[to] += amount;

        emit Transfer(msg.sender, to, amount);
    }
    /* 
    function totalSupply() external view returns (uint256) { // external : 외부에서만 호출 가능, view : 읽기전용
        return totalSupply;
    }
    function balanceOf(address owner) external view returns (uint256){
        return balanceOf[owner];
    }
    function name() external view returns(stirng memory) {
        return name;
    } 
    */
}

/*
approve
 - allow spender address to send my token
transferForm
 - spender: owner -> target address

 * token owner --> bank contract
 * token owner --> router contract --> bank contract
 * token owner --> router contract --> bank contract(multi contract)

*/