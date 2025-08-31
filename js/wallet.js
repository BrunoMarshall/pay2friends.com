// wallet.js - MetaMask connection handling with Ethers.js

let provider;
let signer;
let userAddress = null;

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

const tokenABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

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
    updateBalance();
    const network = await provider.getNetwork();
    if (network.chainId !== 8080) {
      alert("⚠️ Please switch MetaMask to Shardeum Unstablenet (Chain ID: 8080)");
    }
  } catch (err) {
    console.error("Connection failed:", err);
    alert("Connection failed: " + err.message);
  }
}

async function disconnectWallet() {
  userAddress = null;
  provider = null;
  signer = null;
  updateWalletUI();
}

function updateWalletUI() {
  const connectBtn = document.getElementById("connectBtn");
  const walletStatus = document.getElementById("wallet-status");
  const walletStatusSend = document.getElementById("walletStatus");
  const walletAddressEl = document.getElementById("walletAddress");

  if (userAddress) {
    if (connectBtn) connectBtn.innerText = `Log Out (${userAddress.slice(0, 6)}...${userAddress.slice(-4)})`;
    if (walletStatus) walletStatus.innerText = "✅ Connected to Shardeum Unstablenet";
    if (walletStatusSend) walletStatusSend.innerText = "● Connected";
    if (walletStatusSend) walletStatusSend.style.color = "green";
    if (walletAddressEl) walletAddressEl.innerText = `Wallet: ${userAddress}`;
  } else {
    if (connectBtn) connectBtn.innerText = "Log In";
    if (walletStatus) walletStatus.innerText = "❌ Not connected";
    if (walletStatusSend) walletStatusSend.innerText = "● Not connected";
    if (walletStatusSend) walletStatusSend.style.color = "red";
    if (walletAddressEl) walletAddressEl.innerText = "Wallet: Not connected";
  }
}

async function updateBalance() {
  if (!userAddress || !signer) return;
  const walletBalanceEl = document.getElementById("walletBalance");
  if (!walletBalanceEl) return;

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

async function approveToken() {
  if (!provider || !signer) {
    document.getElementById("result").innerHTML = '<p style="color:red;">Please connect wallet first.</p>';
    return;
  }
  const token = document.getElementById("tokenSelectApproval").value;
  const amount = document.getElementById("approvalAmount").value;
  const resultDiv = document.getElementById("result");

  if (token === "0x0" || !amount || Number(amount) <= 0) {
    resultDiv.innerHTML = '<p style="color:red;">Select a valid token and amount.</p>';
    return;
  }

  try {
    const tokenContract = new ethers.Contract(token, tokenABI, signer);
    const amountWei = ethers.utils.parseUnits(amount, 18);
    const tx = await tokenContract.approve(contractAddress, amountWei);
    resultDiv.innerHTML = `<p style="color:blue;">⏳ Approving tokens... Tx: ${tx.hash}</p>`;
    await tx.wait();
    resultDiv.innerHTML = `<p style="color:green;">✅ Tokens approved!</p>`;
  } catch (err) {
    resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

async function depositTokens() {
  if (!provider || !signer) {
    document.getElementById("result").innerHTML = '<p style="color:red;">Please connect wallet first.</p>';
    return;
  }
  const token = document.getElementById("tokenSelectDeposit").value;
  const amount = document.getElementById("depositAmount").value;
  const resultDiv = document.getElementById("result");

  if (!amount || Number(amount) <= 0) {
    resultDiv.innerHTML = '<p style="color:red;">Enter a valid amount.</p>';
    return;
  }

  try {
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    let tx;
    if (token === "0x0") {
      tx = await contract.depositSHM({ value: ethers.utils.parseEther(amount) });
    } else {
      tx = await contract.depositToken(token, ethers.utils.parseUnits(amount, 18));
    }
    resultDiv.innerHTML = `<p style="color:blue;">⏳ Depositing tokens... Tx: ${tx.hash}</p>`;
    await tx.wait();
    resultDiv.innerHTML = `<p style="color:green;">✅ Deposited ${amount} ${token === "0x0" ? "SHM" : "P2F"}</p>`;
    updateBalance();
  } catch (err) {
    resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

async function sendTokens() {
  if (!provider || !signer) {
    document.getElementById("result").innerHTML = '<p style="color:red;">Please connect wallet first.</p>';
    return;
  }
  const recipientInput = document.getElementById("recipient").value.trim().toLowerCase();
  const token = document.getElementById("tokenSelect").value;
  const amount = document.getElementById("amount").value;
  const resultDiv = document.getElementById("result");

  if (!recipientInput || !amount || Number(amount) <= 0) {
    resultDiv.innerHTML = `<p style="color:red;">Enter a valid recipient and amount.</p>`;
    return;
  }

  try {
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    const amountWei = token === "0x0" ? ethers.utils.parseEther(amount) : ethers.utils.parseUnits(amount, 18);
    let tx;

    if (recipientInput.includes('@')) {
      const emailHash = ethers.utils.id(recipientInput);
      console.log("Email:", recipientInput, "Hash:", emailHash); // Debug
      const recipientAddress = await contract.getAddressFromEmail(emailHash);
      console.log("Recipient Address:", recipientAddress); // Debug
      if (recipientAddress === "0x0000000000000000000000000000000000000000") {
        resultDiv.innerHTML = `<p style="color:red;">Error: Email not registered.</p>`;
        return;
      }
      tx = await contract.transfer(recipientAddress, token, amountWei);
    } else {
      // Validate wallet address
      if (!ethers.utils.isAddress(recipientInput)) {
        resultDiv.innerHTML = `<p style="color:red;">Error: Invalid wallet address.</p>`;
        return;
      }
      tx = await contract.transfer(recipientInput, token, amountWei);
    }

    resultDiv.innerHTML = `<p style="color:blue;">⏳ Transaction sent: ${tx.hash}</p>`;
    await tx.wait();
    resultDiv.innerHTML = `<p style="color:green;">✅ Sent ${amount} ${token === "0x0" ? "SHM" : "P2F"} to ${recipientInput}</p>`;
    updateBalance();
  } catch (err) {
    console.error("Send tokens error:", err);
    resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }

  document.getElementById("recipient").value = '';
  document.getElementById("amount").value = '';
}

async function registerEmail() {
  if (!provider || !signer) {
    document.getElementById("result").innerHTML = '<p style="color:red;">Please connect wallet first.</p>';
    return;
  }
  const email = document.getElementById("emailInput").value.trim().toLowerCase();
  const resultDiv = document.getElementById("result");
  if (!email || !email.includes('@')) {
    resultDiv.innerHTML = '<p style="color:red;">Enter a valid email.</p>';
    return;
  }
  try {
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    const emailHash = ethers.utils.id(email);
    console.log("Registering Email:", email, "Hash:", emailHash); // Debug
    const tx = await contract.registerEmail(email);
    resultDiv.innerHTML = `<p style="color:blue;">⏳ Registering email... Tx: ${tx.hash}</p>`;
    await tx.wait();
    resultDiv.innerHTML = `<p style="color:green;">✅ Email registered successfully!</p>`;
  } catch (err) {
    console.error("Register email error:", err);
    resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

// Check for existing MetaMask connection on page load
async function checkExistingConnection() {
  if (typeof window.ethereum !== "undefined") {
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        await connectWallet();
      }
    } catch (err) {
      console.error("Failed to check existing connection:", err);
    }
  }
}

// Toggle connect/disconnect on click
async function handleConnectClick() {
  if (userAddress) {
    await disconnectWallet();
  } else {
    await connectWallet();
  }
}

// Attach event listeners to all buttons
window.addEventListener("load", () => {
  const connectBtn = document.getElementById("connectBtn");
  const connectWalletBtn = document.getElementById("connectWallet");
  const registerEmailBtn = document.getElementById("registerEmailBtn");
  const approveTokenBtn = document.getElementById("approveTokenBtn");
  const depositTokensBtn = document.getElementById("depositTokensBtn");
  const sendBtn = document.getElementById("sendBtn");

  if (connectBtn) {
    connectBtn.addEventListener("click", handleConnectClick);
  }
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener("click", handleConnectClick);
  }
  if (registerEmailBtn) {
    registerEmailBtn.addEventListener("click", registerEmail);
  }
  if (approveTokenBtn) {
    approveTokenBtn.addEventListener("click", approveToken);
  }
  if (depositTokensBtn) {
    depositTokensBtn.addEventListener("click", depositTokens);
  }
  if (sendBtn) {
    sendBtn.addEventListener("click", sendTokens);
  }

  updateWalletUI();
  checkExistingConnection();
  setInterval(updateBalance, 10000);
});

if (typeof window.ethereum !== "undefined") {
  window.ethereum.on("accountsChanged", (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  });
  window.ethereum.on("chainChanged", () => window.location.reload());
}