// wallet.js - MetaMask connection handling with Ethers.js and Firebase Authentication

let provider;
let signer;
let userAddress = null;
let shmPriceUSD = 0;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWf164g_K3CEQ1PFUet2AW45s_IotEGWY",
  authDomain: "pay2friends.firebaseapp.com",
  projectId: "pay2friends",
  storageBucket: "pay2friends.firebasestorage.app",
  messagingSenderId: "368222853853",
  appId: "1:368222853853:web:75af77c46068f68fba9934",
  measurementId: "G-9TSWBZLGSH"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const contractAddress = "0x6cbfaf33505b0d29a03d544f179afb859172daa2"; // Existing contract address
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
    await displayFriends();
  } catch (err) {
    console.error("Connection failed:", err);
    alert("Connection failed: " + err.message);
  }
}

async function disconnectWallet() {
  userAddress = null;
  provider = null;
  signer = null;
  try {
    await auth.signOut(); // Sign out from Firebase
  } catch (err) {
    console.error("Firebase sign-out error:", err);
  }
  updateWalletUI();
  const emailRegisterDiv = document.getElementById("emailRegister");
  const emailVerifyDiv = document.getElementById("emailVerify");
  const registeredEmailEl = document.getElementById("registeredEmail");
  const friendsDropdown = document.getElementById("friendsDropdown");
  if (emailRegisterDiv) emailRegisterDiv.style.display = "block";
  if (emailVerifyDiv) emailVerifyDiv.style.display = "none";
  if (registeredEmailEl) registeredEmailEl.textContent = "Registered Email: None";
  if (friendsDropdown) friendsDropdown.innerHTML = '<option value="">Select a friend</option>';
  localStorage.removeItem("verifiedEmail");
  localStorage.removeItem("verifiedFirebaseEmail");
  await displayFriends();
}

function updateWalletUI() {
  const connectBtn = document.getElementById("connectBtn");
  const walletStatus = document.getElementById("wallet-status");
  const walletStatusSend = document.getElementById("walletStatus");
  const walletAddressEl = document.getElementById("walletAddress");
  const connectWalletBtn = document.getElementById("connectWallet");

  if (userAddress) {
    if (connectBtn) connectBtn.innerText = `Log Out (${userAddress.slice(0, 6)}...${userAddress.slice(-4)})`;
    if (walletStatus) walletStatus.innerText = "✅ Connected to Shardeum Unstablenet";
    if (walletStatusSend) walletStatusSend.innerText = "● Connected";
    if (walletStatusSend) walletStatusSend.style.color = "green";
    if (walletAddressEl) walletAddressEl.innerText = `Wallet: ${userAddress}`;
    if (connectWalletBtn) connectWalletBtn.style.display = "none";
  } else {
    if (connectBtn) connectBtn.innerText = "Log In";
    if (walletStatus) walletStatus.innerText = "❌ Not connected";
    if (walletStatusSend) walletStatusSend.innerText = "● Not connected";
    if (walletStatusSend) walletStatusSend.style.color = "red";
    if (walletAddressEl) walletAddressEl.innerText = "Wallet: Not connected";
    if (connectWalletBtn) connectWalletBtn.style.display = "block";
  }
}

async function checkEmailRegistration() {
  if (!userAddress || !signer) return;
  const emailRegisterDiv = document.getElementById("emailRegister");
  const emailVerifyDiv = document.getElementById("emailVerify");
  const registeredEmailEl = document.getElementById("registeredEmail");
  if (!emailRegisterDiv || !emailVerifyDiv || !registeredEmailEl) return;

  try {
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const emailHash = await contract.getEmailFromAddress(userAddress);
    const storedEmail = localStorage.getItem("verifiedEmail");
    if (emailHash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      emailRegisterDiv.style.display = "none";
      if (storedEmail) {
        registeredEmailEl.textContent = `Registered Email: ${storedEmail}`;
        emailVerifyDiv.style.display = "none";
      } else {
        emailVerifyDiv.style.display = "flex";
        registeredEmailEl.textContent = "Registered Email: Please verify";
      }
    } else {
      emailRegisterDiv.style.display = "flex";
      emailVerifyDiv.style.display = "none";
      registeredEmailEl.textContent = "Registered Email: None";
    }
  } catch (err) {
    console.error("Failed to check email registration:", err);
    registeredEmailEl.textContent = "Registered Email: Error checking";
  }
}

async function verifyEmail() {
  const emailInput = document.getElementById("verifyEmailInput").value.trim().toLowerCase();
  const registeredEmailEl = document.getElementById("registeredEmail");
  const emailVerifyDiv = document.getElementById("emailVerify");
  if (!emailInput || !emailInput.includes('@')) {
    registeredEmailEl.textContent = "Registered Email: Invalid email";
    return;
  }
  try {
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const emailHash = await contract.getEmailFromAddress(userAddress);
    const inputHash = ethers.utils.id(emailInput);
    if (emailHash === inputHash) {
      localStorage.setItem("verifiedEmail", emailInput);
      registeredEmailEl.textContent = `Registered Email: ${emailInput}`;
      emailVerifyDiv.style.display = "none";
    } else {
      registeredEmailEl.textContent = "Registered Email: Email does not match";
    }
  } catch (err) {
    console.error("Email verification error:", err);
    registeredEmailEl.textContent = "Registered Email: Error verifying";
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
  const amountUSD = document.getElementById("amountUSD");
  const amountInput = document.getElementById("amount");
  if (priceConversionEl) {
    priceConversionEl.textContent = `1 SHM = $${shmPriceUSD.toFixed(2)} USD`;
  }
  if (amountUSD && amountInput) {
    const amount = parseFloat(amountInput.value) || 0;
    amountUSD.textContent = `Amount: ${amount} SHM = $${(amount * shmPriceUSD).toFixed(2)} USD`;
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

async function saveFriend(emailOrAddress, address) {
  const friends = JSON.parse(localStorage.getItem("friends") || "[]");
  const isEmail = emailOrAddress.includes('@');
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  let friendData;

  if (isEmail) {
    const emailHash = ethers.utils.id(emailOrAddress);
    const verifiedAddress = await contract.getAddressFromEmail(emailHash);
    if (verifiedAddress === "0x0000000000000000000000000000000000000000") {
      return false; // Email not registered
    }
    friendData = { email: emailOrAddress, address: verifiedAddress };
  } else {
    const emailHash = await contract.getEmailFromAddress(emailOrAddress);
    const storedEmail = localStorage.getItem(`email_${emailOrAddress}`);
    if (emailHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      return false; // Address not registered
    }
    friendData = { email: storedEmail || emailOrAddress, address: emailOrAddress };
  }

  if (!friends.some(f => f.address === friendData.address)) {
    friends.push(friendData);
    localStorage.setItem("friends", JSON.stringify(friends));
  }
  return true;
}

async function displayFriends() {
  const friendsDropdown = document.getElementById("friendsDropdown");
  const friendsList = document.getElementById("friendsList");
  if (!friendsDropdown || !friendsList) return;

  const friends = JSON.parse(localStorage.getItem("friends") || "[]");
  friendsDropdown.innerHTML = '<option value="">Select a friend</option>';
  friendsList.innerHTML = "<h3>Friends</h3><ul>";

  for (const friend of friends) {
    friendsDropdown.innerHTML += `<option value="${friend.email || friend.address}">${friend.email || friend.address}</option>`;
    friendsList.innerHTML += `<li>${friend.email || friend.address} (${friend.address.slice(0, 6)}...${friend.address.slice(-4)})</li>`;
  }

  friendsList.innerHTML += "</ul>";
}

async function addFriend() {
  const friendInput = document.getElementById("friendInput").value.trim().toLowerCase();
  const resultDiv = document.getElementById("result");
  if (!friendInput) {
    resultDiv.innerHTML = `<p style="color:red;">Enter a valid email or address.</p>`;
    return;
  }

  try {
    const success = await saveFriend(friendInput, friendInput);
    if (success) {
      resultDiv.innerHTML = `<p style="color:green;">✅ Friend added successfully!</p>`;
      await displayFriends();
    } else {
      resultDiv.innerHTML = `<p style="color:red;">Error: Email or address not registered.</p>`;
    }
  } catch (err) {
    console.error("Add friend error:", err);
    resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

async function sendMagicLink() {
  const email = document.getElementById("emailInput").value.trim().toLowerCase();
  const resultDiv = document.getElementById("result");
  if (!email || !email.includes('@')) {
    resultDiv.innerHTML = '<p style="color:red;">Enter a valid email.</p>';
    return;
  }

  try {
    const actionCodeSettings = {
      url: window.location.href, // Redirect back to send-tokens.html
      handleCodeInApp: true
    };
    await auth.sendSignInLinkToEmail(email, actionCodeSettings);
    localStorage.setItem("emailForSignIn", email);
    resultDiv.innerHTML = `<p style="color:blue;">⏳ Magic link sent to ${email}. Please check your email.</p>`;
  } catch (err) {
    console.error("Send magic link error:", err);
    resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

async function registerEmail() {
  if (!provider || !signer) {
    document.getElementById("result").innerHTML = '<p style="color:red;">Please connect wallet first.</p>';
    return;
  }
  const email = localStorage.getItem("verifiedFirebaseEmail");
  const resultDiv = document.getElementById("result");
  if (!email) {
    resultDiv.innerHTML = '<p style="color:red;">Please verify your email with the magic link first.</p>';
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
    localStorage.setItem("verifiedEmail", email);
    localStorage.removeItem("verifiedFirebaseEmail");
    localStorage.removeItem("emailForSignIn");
    await checkEmailRegistration();
  } catch (err) {
    console.error("Register email error:", err);
    resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

async function sendTokens() {
  if (!provider || !signer) {
    document.getElementById("result").innerHTML = '<p style="color:red;">Please connect wallet first.</p>';
    return;
  }
  const recipientInput = document.getElementById("recipient").value.trim().toLowerCase();
  const friendsDropdown = document.getElementById("friendsDropdown").value;
  const recipient = friendsDropdown || recipientInput;
  const token = document.getElementById("tokenSelect").value;
  const amount = document.getElementById("amount").value;
  const resultDiv = document.getElementById("result");

  if (!recipient || !amount || Number(amount) <= 0) {
    resultDiv.innerHTML = `<p style="color:red;">Enter a valid recipient and amount.</p>`;
    return;
  }

  try {
    let recipientAddress;
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    if (recipient.includes('@')) {
      const emailHash = ethers.utils.id(recipient);
      console.log("Email:", recipient, "Hash:", emailHash);
      recipientAddress = await contract.getAddressFromEmail(emailHash);
      console.log("Recipient Address:", recipientAddress);
      if (recipientAddress === "0x0000000000000000000000000000000000000000") {
        resultDiv.innerHTML = `<p style="color:red;">Error: Email not registered.</p>`;
        return;
      }
    } else {
      if (!ethers.utils.isAddress(recipient)) {
        resultDiv.innerHTML = `<p style="color:red;">Error: Invalid wallet address.</p>`;
        return;
      }
      recipientAddress = recipient;
    }

    let tx;
    if (token === "0x0") {
      // SHM transfer (native)
      tx = await signer.sendTransaction({
        to: recipientAddress,
        value: ethers.utils.parseEther(amount)
      });
      resultDiv.innerHTML = `<p style="color:blue;">⏳ Transaction sent: ${tx.hash}</p>`;
      await tx.wait();
      resultDiv.innerHTML = `<p style="color:green;">✅ Sent ${amount} SHM to ${recipient}</p>`;
    } else {
      // P2F transfer (ERC-20)
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
      const amountWei = ethers.utils.parseUnits(amount, 18);
      tx = await tokenContract.transfer(recipientAddress, amountWei);
      const logTx = await contract.logTransfer(recipientAddress, token, amountWei);
      resultDiv.innerHTML = `<p style="color:blue;">⏳ Transaction sent: ${tx.hash}, Logging: ${logTx.hash}</p>`;
      await tx.wait();
      await logTx.wait();
      resultDiv.innerHTML = `<p style="color:green;">✅ Sent ${amount} P2F to ${recipient}</p>`;
    }

    await saveFriend(recipient, recipientAddress);
    await displayFriends();
    await updateBalance();
  } catch (err) {
    console.error("Send tokens error:", err);
    resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }

  document.getElementById("recipient").value = '';
  document.getElementById("amount").value = '';
  updatePriceConversion();
}

// Check for existing MetaMask connection and Firebase email link on page load
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

  // Handle Firebase email link
  if (auth.isSignInWithEmailLink(window.location.href)) {
    const email = localStorage.getItem("emailForSignIn");
    if (!email) {
      document.getElementById("result").innerHTML = '<p style="color:red;">Error: No email found for verification.</p>';
      return;
    }
    try {
      await auth.signInWithEmailLink(email, window.location.href);
      localStorage.setItem("verifiedFirebaseEmail", email);
      document.getElementById("result").innerHTML = `<p style="color:green;">✅ Email ${email} verified. Now register it with the blockchain.</p>`;
      localStorage.removeItem("emailForSignIn");
      await checkEmailRegistration();
    } catch (err) {
      console.error("Firebase email link error:", err);
      document.getElementById("result").innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
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
  const sendMagicLinkBtn = document.getElementById("sendMagicLinkBtn");
  const verifyEmailBtn = document.getElementById("verifyEmailBtn");
  const sendBtn = document.getElementById("sendBtn");
  const addFriendBtn = document.getElementById("addFriendBtn");
  const amountInput = document.getElementById("amount");
  const friendsDropdown = document.getElementById("friendsDropdown");

  if (connectBtn) {
    connectBtn.addEventListener("click", handleConnectClick);
  }
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener("click", handleConnectClick);
  }
  if (sendMagicLinkBtn) {
    sendMagicLinkBtn.addEventListener("click", sendMagicLink);
  }
  if (verifyEmailBtn) {
    verifyEmailBtn.addEventListener("click", verifyEmail);
  }
  if (sendBtn) {
    sendBtn.addEventListener("click", sendTokens);
  }
  if (addFriendBtn) {
    addFriendBtn.addEventListener("click", addFriend);
  }
  if (amountInput) {
    amountInput.addEventListener("input", updatePriceConversion);
  }
  if (friendsDropdown) {
    friendsDropdown.addEventListener("change", () => {
      document.getElementById("recipient").value = friendsDropdown.value;
    });
  }

  updateWalletUI();
  checkExistingConnection();
  updateVisitCounter();
  fetchSHMPrice();
  setInterval(fetchSHMPrice, 10000);
  setInterval(updateBalance, 10000);
  displayFriends();
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