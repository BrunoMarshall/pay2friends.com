// wallet.js - MetaMask connection handling with Ethers.js

let provider;
let signer;
let userAddress = null;
let shmPriceUSD = 0;

const contractAddress = "0x6cbfaf33505b0d29a03d544f179afb859172daa2"; // New contract address
const tokenAddress = "0x30d16e2bd13bfdf42a47cc18468240bc3bed69ff"; // P2F token
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
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
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "TransferLogged",
    "type": "event"
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
      { "internalType": "bytes32", "name": "emailHash", "type": "bytes32" }
    ],
    "name": "getAddressFromEmail",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getEmailFromAddress",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "logTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const tokenABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
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

    const network = await provider.getNetwork();
    if (network.chainId !== 8080) {
      alert("⚠️ Please switch MetaMask to Shardeum Unstablenet (Chain ID: 8080)");
      return;
    }

    updateWalletUI();
    await updateBalance();
    await checkEmailRegistration();
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
  const emailRegisterDiv = document.getElementById("emailRegister");
  if (emailRegisterDiv) emailRegisterDiv.style.display = "block";
  const registeredEmailEl = document.getElementById("registeredEmail");
  if (registeredEmailEl) registeredEmailEl.textContent = "Registered Email: None";
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

async function checkEmailRegistration() {
  if (!userAddress || !signer) return;
  const emailRegisterDiv = document.getElementById("emailRegister");
  const registeredEmailEl = document.getElementById("registeredEmail");
  if (!emailRegisterDiv || !registeredEmailEl) return;

  try {
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const emailHash = await contract.getEmailFromAddress(userAddress);
    if (emailHash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      emailRegisterDiv.style.display = "none";
      registeredEmailEl.textContent = `Registered Email: ${emailHash} (Hash)`;
    } else {
      emailRegisterDiv.style.display = "flex";
      registeredEmailEl.textContent = "Registered Email: None";
    }
  } catch (err) {
    console.error("Failed to check email registration:", err);
    registeredEmailEl.textContent = "Registered Email: Error checking";
  }
}

async function updateBalance() {
  if (!userAddress || !signer) {
    console.log("No user address or signer, skipping balance update");
    return;
  }
  const walletBalanceEl = document.getElementById("walletBalance");
  if (!walletBalanceEl) {
    console.log("No walletBalance element found");
    return;
  }

  try {
    // Get SHM balance (native token)
    let shmBalance = "0.000";
    try {
      const shmBalanceWei = await provider.getBalance(userAddress);
      shmBalance = Number(ethers.utils.formatEther(shmBalanceWei)).toFixed(3);
      console.log("SHM balance:", shmBalance);
    } catch (err) {
      console.error("Failed to fetch SHM balance:", err);
    }

    // Get P2F balance (ERC-20)
    let p2fBalance = "0.000";
    try {
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
      const p2fBalanceWei = await tokenContract.balanceOf(userAddress);
      p2fBalance = Number(ethers.utils.formatUnits(p2fBalanceWei, 18)).toFixed(3);
      console.log("P2F balance:", p2fBalance);
    } catch (err) {
      console.error("Failed to fetch P2F balance:", err);
    }

    walletBalanceEl.textContent = `Balance: ${shmBalance} SHM / ${p2fBalance} P2F`;
  } catch (err) {
    console.error("Balance update failed:", err);
    walletBalanceEl.textContent = "Balance: Error fetching balances";
  }
}

async function fetchSHMPrice() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=shardeum&vs_currencies=usd");
    const data = await response.json();
    shmPriceUSD = data.shardeum?.usd || 0;
    console.log("SHM Price (USD):", shmPriceUSD);
    updatePriceConversion();
  } catch (err) {
    console.error("Failed to fetch SHM price:", err);
    shmPriceUSD = 0;
    updatePriceConversion();
  }
}

function updatePriceConversion() {
  const priceConversionEl = document.getElementById("priceConversion");
  if (priceConversionEl) {
    priceConversionEl.textContent = `1 SHM = $${shmPriceUSD.toFixed(2)} USD`;
  }
}

function updateVisitCounter() {
  const visitCounterEl = document.getElementById("visitCounter");
  if (!visitCounterEl) return;

  let visits = parseInt(localStorage.getItem("pageVisits") || "0");
  visits += 1;
  localStorage.setItem("pageVisits", visits.toString());
  visitCounterEl.textContent = `Page Visits: ${visits}`;
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
    let recipientAddress;
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    if (recipientInput.includes('@')) {
      const emailHash = ethers.utils.id(recipientInput);
      console.log("Email:", recipientInput, "Hash:", emailHash);
      recipientAddress = await contract.getAddressFromEmail(emailHash);
      console.log("Recipient Address:", recipientAddress);
      if (recipientAddress === "0x0000000000000000000000000000000000000000") {
        resultDiv.innerHTML = `<p style="color:red;">Error: Email not registered.</p>`;
        return;
      }
    } else {
      if (!ethers.utils.isAddress(recipientInput)) {
        resultDiv.innerHTML = `<p style="color:red;">Error: Invalid wallet address.</p>`;
        return;
      }
      recipientAddress = recipientInput;
    }

    let tx;
    if (token === "0x0") {
      // SHM transfer (native)
      tx = await signer.sendTransaction({
        to: recipientAddress,
        value: ethers.utils.parseEther(amount)
      });
    } else {
      // P2F transfer (ERC-20)
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
      const amountWei = ethers.utils.parseUnits(amount, 18);
      tx = await tokenContract.transfer(recipientAddress, amountWei);
    }

    // Log transfer in Pay2Friends contract
    const logTx = await contract.logTransfer(recipientAddress, token, ethers.utils.parseUnits(amount, token === "0x0" ? 18 : 18));
    resultDiv.innerHTML = `<p style="color:blue;">⏳ Transaction sent: ${tx.hash}, Logging: ${logTx.hash}</p>`;
    await tx.wait();
    await logTx.wait();
    resultDiv.innerHTML = `<p style="color:green;">✅ Sent ${amount} ${token === "0x0" ? "SHM" : "P2F"} to ${recipientInput}</p>`;
    await updateBalance();
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
    console.log("Registering Email:", email, "Hash:", emailHash);
    const tx = await contract.registerEmail(email);
    resultDiv.innerHTML = `<p style="color:blue;">⏳ Registering email... Tx: ${tx.hash}</p>`;
    await tx.wait();
    resultDiv.innerHTML = `<p style="color:green;">✅ Email registered successfully!</p>`;
    await checkEmailRegistration();
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
  if (sendBtn) {
    sendBtn.addEventListener("click", sendTokens);
  }

  updateWalletUI();
  checkExistingConnection();
  updateVisitCounter();
  fetchSHMPrice();
  setInterval(fetchSHMPrice, 10000);
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