const { ethers } = require('ethers');
const contractABI = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "balances",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]; // ABI from Remix
const contractAddress = 0x8b28d7d5ce9ba60e884848f0054133f3736da4e3; // Contract address deployed in Remix

async function init() {
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        const sendBtn = document.getElementById('sendBtn');
        const resultDiv = document.getElementById('result');

        sendBtn.addEventListener('click', async () => {
            const tokenType = document.getElementById('token-type').value;
            const recipient = document.getElementById('recipient').value;
            const amount = ethers.utils.parseEther(document.getElementById('amount').value || '0');

            if (!recipient || amount.isZero()) {
                resultDiv.innerHTML = '<p style="color: red;">Please enter a valid recipient address and amount.</p>';
                return;
            }

            try {
                const tx = await contract.transfer(recipient, amount);
                await tx.wait();
                resultDiv.innerHTML = `<p style="color: green;">Sent ${ethers.utils.formatEther(amount)} ${tokenType} to ${recipient}. Tx: ${tx.hash}</p>`;
            } catch (error) {
                resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }

            document.getElementById('recipient').value = '';
            document.getElementById('amount').value = '';
        });
    } else {
        document.getElementById('result').innerHTML = '<p style="color: red;">Please install MetaMask.</p>';
    }
}

window.addEventListener('load', init);