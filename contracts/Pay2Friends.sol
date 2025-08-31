// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Pay2Friends is ReentrancyGuard {
    address public owner;
    mapping(address => bool) public supportedTokens;
    mapping(address => mapping(address => uint256)) public balances;
    mapping(bytes32 => address) private emailToAddress;

    event Transfer(address indexed from, address indexed to, address indexed token, uint256 amount);
    event EmailRegistered(address indexed user, bytes32 indexed emailHash);
    event EmailUpdated(address indexed user, bytes32 indexed oldEmailHash, bytes32 indexed newEmailHash);
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdrawal(address indexed user, address indexed token, uint256 amount);
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);

    constructor() {
        owner = msg.sender;
        supportedTokens[address(0)] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function addToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!supportedTokens[token], "Token already supported");
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }

    function removeToken(address token) external onlyOwner {
        require(token != address(0), "Cannot remove native SHM");
        require(supportedTokens[token], "Token not supported");
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }

    function depositSHM() public payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender][address(0)] += msg.value;
        emit Deposit(msg.sender, address(0), msg.value);
    }

    function depositToken(address token, uint256 amount) public nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Deposit amount must be greater than 0");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        balances[msg.sender][token] += amount;
        emit Deposit(msg.sender, token, amount);
    }

    function transfer(address recipient, address token, uint256 amount) public nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(balances[msg.sender][token] >= amount, "Insufficient balance");
        require(recipient != address(0), "Invalid recipient address");

        balances[msg.sender][token] -= amount;
        balances[recipient][token] += amount;
        emit Transfer(msg.sender, recipient, token, amount);
    }

    function withdraw(address token, uint256 amount) public nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(balances[msg.sender][token] >= amount, "Insufficient balance");

        balances[msg.sender][token] -= amount;
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            require(IERC20(token).transfer(msg.sender, amount), "Token transfer failed");
        }
        emit Withdrawal(msg.sender, token, amount);
    }

    function getBalance(address account, address token) public view returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        return balances[account][token];
    }

    function registerEmail(string calldata email) public {
        require(bytes(email).length > 0, "Email cannot be empty");
        bytes32 emailHash = keccak256(bytes(email));
        require(emailToAddress[emailHash] == address(0), "Email already registered");
        emailToAddress[emailHash] = msg.sender;
        emit EmailRegistered(msg.sender, emailHash);
    }

    function updateEmail(string calldata oldEmail, string calldata newEmail) public {
        require(bytes(newEmail).length > 0, "New email cannot be empty");
        bytes32 oldEmailHash = keccak256(bytes(oldEmail));
        bytes32 newEmailHash = keccak256(bytes(newEmail));
        require(emailToAddress[oldEmailHash] == msg.sender, "Old email not registered to this address");
        require(emailToAddress[newEmailHash] == address(0), "New email already registered");
        emailToAddress[oldEmailHash] = address(0);
        emailToAddress[newEmailHash] = msg.sender;
        emit EmailUpdated(msg.sender, oldEmailHash, newEmailHash);
    }

    function getAddressFromEmail(bytes32 emailHash) external view returns (address) {
        return emailToAddress[emailHash];
    }
}