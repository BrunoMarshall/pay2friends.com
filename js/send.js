// send.js - Direct SHM transfers using Pay2Friends contract

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

async function sendToken() {
  const resultDiv = document.getElementById("result");

  if (!signer) {
    resultDiv.innerHTML = "<p style='color:red;'>⚠️ Connect wallet first.</p>";
    return;
  }

  const recipient = document.getElementById("recipient").value.trim();
  const amount = document.getElementById("amount").value.trim();

  if (!recipient || amount <= 0) {
    resultDiv.innerHTML = "<p style='color:red;'>❌ Invalid recipient or amount.</p>";
    return;
  }

  try {
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    const tx = await contract.transfer(recipient, {
      value: ethers.utils.parseEther(amount) // sending SHM directly
    });

    resultDiv.innerHTML = `<p style='color:blue;'>⏳ Transaction sent: ${tx.hash}</p>`;

    await tx.wait();
    resultDiv.innerHTML = `<p style='color:green;'>✅ Sent ${amount} SHM to ${recipient}</p>`;
  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = `<p style='color:red;'>⚠️ Error: ${error.message}</p>`;
  }
}

