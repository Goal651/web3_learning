import React, { useState, useEffect } from 'react';
import Web3, { Contract, type ContractAbi } from 'web3';
import './App.css';

const contractAddress = "0x89C9CFA6e23373B4F75F8D8a8d2c5ba59a5074f3";

const contractABI: ContractAbi = [

  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_votingTimeInMinutes",
        "type": "uint256"
      }
    ],
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
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "candidateAdded",
    "type": "event"
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
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newDeadline",
        "type": "uint256"
      }
    ],
    "name": "votingDeadlineChanged",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
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
    "type": "function",
    "constant": true
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
    "type": "function",
    "constant": true
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
    "type": "function",
    "constant": true
  },
  {
    "inputs": [],
    "name": "votingDeadline",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      }
    ],
    "name": "addCandidate",
    "outputs": [],
    "stateMutability": "nonpayable",
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
        "internalType": "uint256",
        "name": "newDeadline",
        "type": "uint256"
      }
    ],
    "name": "changeDeadline",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }

];

interface Candidate {
  id: string;
  name: string;
  voteCount: string;
}

const App: React.FC = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [activeTab, setActiveTab] = useState<'vote' | 'add'>('vote');
  const [account, setAccount] = useState<string>('');
  const [contract, setContract] = useState<Contract<ContractAbi> | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [admin, setAdmin] = useState<string>('');
  const [deadline, setDeadline] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [newCandidateName, setNewCandidateName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWeb3();
  }, []);

  useEffect(() => {
    if (contract) {
      loadCandidates(contract);
      loadAdmin(contract);
      loadDeadline(contract);
    }
  }, [contract]);

  useEffect(() => {
    // Countdown timer update every second
    const timer = setInterval(() => {
      if (deadline > 0) {
        const now = Math.floor(Date.now() / 1000);
        const diff = deadline - now;
        if (diff > 0) {
          setTimeRemaining(`${Math.floor(diff / 60)}m ${diff % 60}s`);
        } else {
          setTimeRemaining("Voting closed");
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

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

  const loadAdmin = async (votingContract: Contract<ContractAbi>): Promise<void> => {
    try {
      const adminAddress = await votingContract.methods.admin().call();
      setAdmin(adminAddress);
    } catch (err) {
      console.error("Error loading admin:", err);
    }
  };

  const loadDeadline = async (votingContract: Contract<ContractAbi>): Promise<void> => {
    try {
      const deadlineValue = await votingContract.methods.votingDeadline().call();
      setDeadline(Number(deadlineValue));
    } catch (err) {
      console.error("Error loading deadline:", err);
    }
  };

  const vote = async (candidateId: string): Promise<void> => {
    if (!contract || !web3) {
      alert("Contract or Web3 not initialized.");
      return;
    }
    setLoading(true);
    try {
      web3.eth.getGasPrice().then(console.log)
      await contract.methods.vote(candidateId).send({
        from: account,
        gas: '300000',
        gasPrice: await web3.eth.getGasPrice().then((price) => price.toString())
      });
      alert("Vote successfully cast!");
      await loadCandidates(contract);
    } catch (err: unknown) {
      console.error("Error casting vote:", err);
      alert("Transaction failed or already voted.");
    }
    setLoading(false);
  };

  const addCandidate = async (): Promise<void> => {
    if (!contract || !web3) {
      alert("Contract or Web3 not initialized.");
      return;
    }
    if (!newCandidateName) {
      alert("Candidate name cannot be empty.");
      return;
    }
    setLoading(true);
    try {
      await contract.methods.addCandidate(newCandidateName).send({
        from: account,
        gas: '300000',
        gasPrice: await web3.eth.getGasPrice().then((price) => price.toString())
      });
      alert("Candidate added successfully!");
      setNewCandidateName('');
      loadCandidates(contract);
    } catch (err: unknown) {
      console.error("Error adding candidate:", err);
      alert("Failed to add candidate.");
    }
    setLoading(false);
  };

  const isAdmin = account.toLowerCase() === admin.toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-6">
      <div className="flex justify-center mb-6 space-x-4">
        <button
          className={`px-4 py-2 rounded-t-lg ${activeTab === 'vote' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={() => setActiveTab('vote')}
        >
          Vote
        </button>
        {isAdmin && (
          <button
            className={`px-4 py-2 rounded-t-lg ${activeTab === 'add' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setActiveTab('add')}
          >
            Add Candidate
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
          🗳️ Simple Voting DApp
        </h1>

        <p className="text-center text-gray-600 mb-4">
          <strong>Connected Account:</strong> {account || 'Not connected'}
        </p>

        <p className="text-center text-gray-600 mb-4">
          <strong>Time Remaining:</strong> {timeRemaining}
        </p>

        <div className="flex justify-center mb-8">
          <button
            onClick={loadWeb3}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            Connect MetaMask
          </button>
        </div>

        {activeTab === 'vote' && (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Candidates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg shadow hover:shadow-lg p-6 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {candidate.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Votes: <span className="font-bold">{candidate.voteCount}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => vote(candidate.id)}
                    disabled={loading}
                    className={`mt-4 ${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white font-medium py-2 px-4 rounded transition`}
                  >
                    {loading ? 'Voting...' : 'Vote'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'add' && isAdmin && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add Candidate</h2>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">New Candidate Name:</label>
              <div className="flex">
                <input
                  type="text"
                  value={newCandidateName}
                  onChange={(e) => setNewCandidateName(e.target.value)}
                  className="flex-1 border rounded-l-lg px-4 py-2"
                  placeholder="Enter candidate name"
                />
                <button
                  onClick={addCandidate}
                  disabled={loading}
                  className={`bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-r-lg transition ${loading && 'bg-gray-400'}`}
                >
                  {loading ? 'Adding...' : 'Add Candidate'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Admin Panel</h2>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">New Candidate Name:</label>
              <div className="flex">
                <input
                  type="text"
                  value={newCandidateName}
                  onChange={(e) => setNewCandidateName(e.target.value)}
                  className="flex-1 border rounded-l-lg px-4 py-2"
                  placeholder="Enter candidate name"
                />
                <button
                  onClick={addCandidate}
                  disabled={loading}
                  className={`bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-r-lg transition ${loading && 'bg-gray-400'}`}
                >
                  {loading ? 'Adding...' : 'Add Candidate'}
                </button>
              </div>
            </div>
            {/* Additional admin functions such as changing deadline could be added here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
