// wallet.js - MetaMask connection handling with Ethers.js

let provider;
let signer;
let userAddress = null;

async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert("MetaMask is not installed. Please install it: https://metamask.io/");
    return;
  }

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    document.getElementById("connectBtn").innerText = 
      userAddress.slice(0, 6) + "..." + userAddress.slice(-4);

    document.getElementById("wallet-status").innerText = "✅ Connected to Shardeum Unstablenet";

    // Check network
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
  document.getElementById("connectBtn").innerText = "Connect Wallet";
  document.getElementById("wallet-status").innerText = "❌ Not connected";
}

// Auto-refresh on account/network change
if (typeof window.ethereum !== "undefined") {
  window.ethereum.on("accountsChanged", () => connectWallet());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
