const contractABI = [
  {
    "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }],
    "name": "transfer",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const contractAddress = "0xf5fb927a7f7d2679d61f0c316b632587e194b37e";

let provider, signer, userAddress;

async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    alert("Please install MetaMask!");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();

  document.getElementById("walletAddress").innerText = userAddress;

  updateBalance();
}

async function updateBalance() {
  if (!provider || !userAddress) return;
  const balance = await provider.getBalance(userAddress);
  document.getElementById("walletBalance").innerText = ethers.utils.formatEther(balance);
}

async function sendToken() {
  const recipient = document.getElementById("recipient").value.trim();
  const amount = document.getElementById("amount").value.trim();
  const resultDiv = document.getElementById("result");

  if (!signer) {
    resultDiv.innerHTML = "<p style='color:red;'>⚠️ Connect wallet first.</p>";
    return;
  }

  if (!recipient || amount <= 0) {
    resultDiv.innerHTML = "<p style='color:red;'>❌ Invalid recipient or amount.</p>";
    return;
  }

  const balance = await provider.getBalance(userAddress);
  if (ethers.utils.parseEther(amount).gt(balance)) {
    resultDiv.innerHTML = "<p style='color:red;'>❌ Insufficient balance.</p>";
    return;
  }

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  try {
    const tx = await contract.transfer(recipient, {
      value: ethers.utils.parseEther(amount)
    });
    resultDiv.innerHTML = `<p style='color:blue;'>⏳ Transaction sent: ${tx.hash}</p>`;
    await tx.wait();
    resultDiv.innerHTML = `<p style='color:green;'>✅ Sent ${amount} SHM to ${recipient}</p>`;
    updateBalance(); // refresh balance
    document.getElementById("recipient").value = '';
    document.getElementById("amount").value = '';
  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = `<p style='color:red;'>⚠️ Error: ${error.message}</p>`;
  }
}

// Event listeners
window.addEventListener("load", () => {
  document.getElementById("connectBtn").addEventListener("click", connectWallet);
  document.getElementById("sendBtn").addEventListener("click", sendToken);
});
