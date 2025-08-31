// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Pay2Friends {
    address public owner;
    mapping(bytes32 => address) public emailToAddress;
    mapping(address => bytes32) public addressToEmail;

    event EmailRegistered(address indexed user, bytes32 indexed emailHash);
    event TransferLogged(address indexed from, address indexed to, address indexed token, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function registerEmail(string memory email) public {
        bytes32 emailHash = keccak256(abi.encodePacked(email));
        require(emailToAddress[emailHash] == address(0), "Email already registered");
        require(addressToEmail[msg.sender] == bytes32(0), "Address already registered");
        emailToAddress[emailHash] = msg.sender;
        addressToEmail[msg.sender] = emailHash;
        emit EmailRegistered(msg.sender, emailHash);
    }

    function getAddressFromEmail(bytes32 emailHash) public view returns (address) {
        return emailToAddress[emailHash];
    }

    function getEmailFromAddress(address user) public view returns (bytes32) {
        return addressToEmail[user];
    }

    function logTransfer(address to, address token, uint256 amount) public {
        require(to != address(0), "Invalid recipient");
        emit TransferLogged(msg.sender, to, token, amount);
    }
}