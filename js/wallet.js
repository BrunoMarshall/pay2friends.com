// wallet.js - MetaMask connection handling with Ethers.js

let provider;
let signer;
let userAddress = null;

async function connectWallet() {
  if (typeof ethers === "undefined") {
    alert("⚠️ Ethers.js not loaded. Please check script order.");
    return;
  }
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask is not installed. Please install it: https://metamask.io/");
    return;
  }

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    updateWalletUI();
    const network = await provider.getNetwork();
    if (network.chainId !== 8080) {
      alert("⚠️ Please switch MetaMask to Shardeum Unstablenet (Chain ID: 8080)");
    }
  } catch (err) {
    console.error(err);
    alert("Connection failed: " + err.message);
  }
}

async function disconnectWallet() {
  userAddress = null;
  updateWalletUI();
}

function updateWalletUI() {
  const connectBtn = document.getElementById("connectBtn");
  const walletStatus = document.getElementById("wallet-status");
  const walletStatusSend = document.getElementById("walletStatus");
  const walletAddressEl = document.getElementById("walletAddress");

  if (userAddress) {
    if (connectBtn) connectBtn.innerText = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    if (walletStatus) walletStatus.innerText = "✅ Connected to Shardeum Unstablenet";
    if (walletStatus) walletStatus.style.color = "#00C897";
    if (walletStatusSend) walletStatusSend.innerText = "● Connected";
    if (walletStatusSend) walletStatusSend.style.color = "green";
    if (walletAddressEl) walletAddressEl.innerText = `Wallet: ${userAddress}`;
  } else {
    if (connectBtn) connectBtn.innerText = "Log In";
    if (walletStatus) walletStatus.innerText = "❌ Not connected";
    if (walletStatus) walletStatus.style.color = "#f00";
    if (walletStatusSend) walletStatusSend.innerText = "● Not connected";
    if (walletStatusSend) walletStatusSend.style.color = "red";
    if (walletAddressEl) walletAddressEl.innerText = "Wallet: Not connected";
  }
}

async function updateBalance() {
  if (!userAddress || !signer) return;
  const walletBalanceEl = document.getElementById("walletBalance");
  if (!walletBalanceEl) return;

  const contractAddress = "0x543d71889f984d36fc7d2b1fa019be4c5738ba6b";
  const tokenAddress = "0x30d16e2bd13bfdf42a47cc18468240bc3bed69ff";
  const contractABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
        { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
        { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
        { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
        { "indexed": true, "internalType": "bytes32", "name": "emailHash", "type": "bytes32" }
      ],
      "name": "EmailRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
        { "indexed": true, "internalType": "bytes32", "name": "oldEmailHash", "type": "bytes32" },
        { "indexed": true, "internalType": "bytes32", "name": "newEmailHash", "type": "bytes32" }
      ],
      "name": "EmailUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
        { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
        { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "Deposit",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
        { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
        { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "Withdrawal",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "token", "type": "address" }
      ],
      "name": "TokenAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "token", "type": "address" }
      ],
      "name": "TokenRemoved",
      "type": "event"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "token", "type": "address" }
      ],
      "name": "addToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "token", "type": "address" }
      ],
      "name": "removeToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "depositSHM",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "token", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "depositToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "recipient", "type": "address" },
        { "internalType": "address", "name": "token", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "transfer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "account", "type": "address" },
        { "internalType": "address", "name": "token", "type": "address" }
      ],
      "name": "getBalance",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "token", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "string", "name": "email", "type": "string" }
      ],
      "name": "registerEmail",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "string", "name": "oldEmail", "type": "string" },
        { "internalType": "string", "name": "newEmail", "type": "string" }
      ],
      "name": "updateEmail",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "bytes32", "name": "emailHash", "type": "bytes32" }
      ],
      "name": "getAddressFromEmail",
      "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "", "type": "address" }
      ],
      "name": "supportedTokens",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  try {
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    const shmBalanceWei = await contract.getBalance(userAddress, "0x0");
    const p2fBalanceWei = await contract.getBalance(userAddress, tokenAddress);
    const shmBalance = ethers.utils.formatEther(shmBalanceWei);
    const p2fBalance = ethers.utils.formatUnits(p2fBalanceWei, 18);
    
    walletBalanceEl.textContent = `Balance: ${shmBalance} SHM / ${p2fBalance} P2F`;
  } catch (err) {
    console.error("Balance update failed:", err);
  }
}

// Attach event listener to connect button
window.addEventListener("load", () => {
  const connectBtn = document.getElementById("connectBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", connectWallet);
  }
  updateWalletUI();
  setInterval(updateBalance, 10000);
});

if (typeof window.ethereum !== "undefined") {
  window.ethereum.on("accountsChanged", () => connectWallet());
  window.ethereum.on("chainChanged", () => window.location.reload());
}