import React, { useState, useEffect } from 'react';
import Web3, { Contract, type ContractAbi } from 'web3';
import './App.css';

// Define the contract address
const contractAddress = "0x847abb4fc85a108F59eEcCE5c3f119CDa53b5B56"; // Replace with your deployed contract address

// Define the contract ABI
const contractABI: ContractAbi = [
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
        "internalType": "uint256",
        "name": "candidateId",
        "type": "uint256"
      }
    ],
    "name": "votedEvent",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "candidates",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "voteCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "candidatesCount",
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
        "internalType": "uint256",
        "name": "_candidateId",
        "type": "uint256"
      }
    ],
    "name": "vote",
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
    "name": "voters",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Define the Candidate interface
interface Candidate {
  id: string;
  name: string;
  voteCount: string;
}

const App: React.FC = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string>('');
  const [contract, setContract] = useState<Contract<ContractAbi> | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    loadWeb3();
  }, []);

  const loadWeb3 = async (): Promise<void> => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0] || '');
        const votingContract = new web3Instance.eth.Contract(contractABI, contractAddress);
        setContract(votingContract);
        loadCandidates(votingContract);
      } catch (err: unknown) {
        console.error("Failed to connect MetaMask:", err);
        alert("Could not connect to MetaMask. Check console.");
      }
    } else {
      alert("MetaMask not detected! Please install MetaMask.");
    }
  };

  const loadCandidates = async (votingContract: Contract<ContractAbi>): Promise<void> => {
    try {
      const count = await votingContract.methods.candidatesCount().call();
      const candidatesList: Candidate[] = [];
      for (let i = 1; i <= Number(count); i++) {
        const candidate = await votingContract.methods.candidates(i).call() as Candidate;
        candidatesList.push({
          id: candidate.id,
          name: candidate.name,
          voteCount: candidate.voteCount
        });
      }
      setCandidates(candidatesList);
    } catch (err: unknown) {
      console.error("Error loading candidates:", err);
      alert("Error loading candidates. Check console.");
    }
  };

  const vote = async (candidateId: string): Promise<void> => {
    if (!contract) {
      alert("Contract not initialized.");
      return;
    }
    try {
      await contract.methods.vote(candidateId).send({ from: account });
      alert("Vote successfully cast!");
      loadCandidates(contract);
    } catch (err: unknown) {
      console.error("Error casting vote:", err);
      alert("Transaction failed or already voted.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">A Simple Voting DApp</h1>
      <p className="text-lg mb-4">Connected Account: {account || 'Not connected'}</p>
      <button
        onClick={loadWeb3}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
      >
        Connect MetaMask
      </button>
      <ul className="w-full max-w-md">
        {candidates.map((candidate) => (
          <li
            key={candidate.id}
            className="flex justify-between items-center bg-white p-4 mb-2 rounded shadow"
          >
            <span>{candidate.name} ({candidate.voteCount} votes)</span>
            <button
              onClick={() => vote(candidate.id)}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Vote
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;