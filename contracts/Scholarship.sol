// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./SimpleMultiSig.sol";

contract Scholarship {
    struct Application {
        uint256 id;
        address payable applicant;
        string studentId;
        string name;
        uint256 amountRequested;
        bool approved;
        bool disbursed;
    }

    address public adminMultiSig;
    address public owner;
    uint256 public nextApplicationId;
    mapping(uint256 => Application) public applications;

    event ApplicationSubmitted(uint256 id, address applicant, uint256 amount);
    event ApplicationApproved(uint256 id);
    event FundsDisbursed(uint256 id, address to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _multiSig) payable {
        owner = msg.sender;
        adminMultiSig = _multiSig;
        nextApplicationId = 1;
    }

    // Students submit application
    function submitApplication(
        string calldata studentId,
        string calldata name,
        uint256 amountRequested
    ) external {
        require(amountRequested > 0, "Amount must be > 0");
        uint256 id = nextApplicationId++;
        applications[id] = Application({
            id: id,
            applicant: payable(msg.sender),
            studentId: studentId,
            name: name,
            amountRequested: amountRequested,
            approved: false,
            disbursed: false
        });
        emit ApplicationSubmitted(id, msg.sender, amountRequested);
    }

    // Approve application — only multi-sig contract can call this (after owners confirm)
    function approveApplication(uint256 id) external {
        require(id > 0 && id < nextApplicationId, "Invalid id");
        require(msg.sender == adminMultiSig, "Only multisig");
        Application storage app = applications[id];
        require(!app.approved, "Already approved");
        app.approved = true;
        emit ApplicationApproved(id);
    }

    // Disburse funds to applicant — can be called by owner (for convenience) or multisig
    function disburse(uint256 id) external {
        Application storage app = applications[id];
        require(app.approved, "Not approved");
        require(!app.disbursed, "Already disbursed");
        require(address(this).balance >= app.amountRequested, "Insufficient contract balance");

        // Allow multisig or owner to call disburse
        require(
            msg.sender == adminMultiSig || msg.sender == owner,
            "Not authorized to disburse"
        );

        app.disbursed = true;
        app.applicant.transfer(app.amountRequested);
        emit FundsDisbursed(id, app.applicant, app.amountRequested);
    }

    // Allow contract to receive donations / top-up
    receive() external payable {}

    function getApplication(uint256 id) external view returns (Application memory) {
        return applications[id];
    }
}
