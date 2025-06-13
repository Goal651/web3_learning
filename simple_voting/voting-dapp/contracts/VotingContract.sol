// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    // --- Data Structures ---
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;
    uint public candidatesCount;

    // --- Admin & Deadline ---
    address public admin;  // The admin who can add candidates after deployment
    uint public votingDeadline;  // Unix timestamp when voting ends

    // --- Events ---
    event votedEvent(uint indexed candidateId);
    event candidateAdded(uint indexed candidateId, string name);
    event votingDeadlineChanged(uint newDeadline);

    // --- Modifiers ---
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action.");
        _;
    }

    modifier beforeDeadline() {
        require(block.timestamp < votingDeadline, "Voting deadline has passed.");
        _;
    }

    // --- Constructor ---
    constructor(uint _votingTimeInMinutes) {
        admin = msg.sender; // set the deployer as admin
        // Set deadline (for example, X minutes from deployment)
        votingDeadline = block.timestamp + (_votingTimeInMinutes * 1 minutes);

        // Initially add some candidates (admin actions)
        _addCandidate("Rama");
        _addCandidate("Nick");
        _addCandidate("Jose");
    }

    // --- Internal Candidate Addition ---
    function _addCandidate(string memory _name) internal {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit candidateAdded(candidatesCount, _name);
    }

    // --- Admin Function to Add Candidate After Deployment ---
    function addCandidate(string memory _name) public onlyAdmin beforeDeadline {
        _addCandidate(_name);
    }

    // --- Voting Function ---
    function vote(uint _candidateId) public beforeDeadline {
        require(!voters[msg.sender], "Already voted.");
        require(
            _candidateId > 0 && _candidateId <= candidatesCount,
            "Invalid candidate"
        );
        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        emit votedEvent(_candidateId);
    }

    // --- Admin Function to Change Deadline ---
    function changeDeadline(uint newDeadline) public onlyAdmin {
        require(newDeadline > block.timestamp, "Deadline must be in the future");
        votingDeadline = newDeadline;
        emit votingDeadlineChanged(newDeadline);
    }
}
