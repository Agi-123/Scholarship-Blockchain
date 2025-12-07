// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SimpleMultiSig {
    event Deposit(address indexed sender, uint amount);
    event SubmitTransaction(address indexed owner, uint indexed txIndex, address indexed to, uint value, bytes data);
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public required;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint confirmations;
    }

    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public isConfirmed;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    constructor(address[] memory _owners, uint _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required count");

        for (uint i = 0; i < _owners.length; i++) {
            address o = _owners[i];
            require(o != address(0), "Invalid owner");
            require(!isOwner[o], "Owner not unique");
            isOwner[o] = true;
            owners.push(o);
        }
        required = _required;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submitTransaction(address to, uint value, bytes memory data) public onlyOwner {
        transactions.push(
            Transaction({
                to: to,
                value: value,
                data: data,
                executed: false,
                confirmations: 0
            })
        );
        emit SubmitTransaction(msg.sender, transactions.length - 1, to, value, data);
    }

    function confirmTransaction(uint txIndex) public onlyOwner {
        require(txIndex < transactions.length, "Invalid tx index");
        Transaction storage transaction = transactions[txIndex];
        require(!transaction.executed, "Already executed");
        require(!isConfirmed[txIndex][msg.sender], "Already confirmed");
        isConfirmed[txIndex][msg.sender] = true;
        transaction.confirmations += 1;
        emit ConfirmTransaction(msg.sender, txIndex);
        if (transaction.confirmations >= required) {
            _executeTransaction(txIndex);
        }
    }

    function _executeTransaction(uint txIndex) internal {
        Transaction storage transaction = transactions[txIndex];
        require(!transaction.executed, "Already executed");
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "tx failed");
        transaction.executed = true;
        emit ExecuteTransaction(msg.sender, txIndex);
    }

    // Helpers
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns (uint) {
        return transactions.length;
    }
}
