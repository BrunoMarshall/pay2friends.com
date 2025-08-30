// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Pay2Friends {
    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function transfer(address recipient) public payable {
        require(msg.value > 0, "Amount must be greater than zero");
        require(recipient != address(0), "Invalid recipient address");

        payable(recipient).transfer(msg.value);

        emit Transfer(msg.sender, recipient, msg.value);
    }
}
