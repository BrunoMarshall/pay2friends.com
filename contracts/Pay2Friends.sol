// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Pay2Friends {
    address public owner;
    mapping(address => uint256) public balances;

    event Transfer(address indexed from, address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function transfer(address recipient, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(recipient != address(0), "Invalid recipient address");

        balances[msg.sender] -= amount;
        balances[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
    }

    function getBalance(address account) public view returns (uint256) {
        return balances[account];
    }

    function withdraw(uint256 amount) public onlyOwner {
        require(balances[owner] >= amount, "Insufficient balance");
        payable(owner).transfer(amount);
        balances[owner] -= amount;
    }
}