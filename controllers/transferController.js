const Account = require('../models/accountModel');
const Transfer = require('../models/transferModel');

exports.transferFunds = async (req, res) => {
    const { fromAccountId, toAccountId, amount } = req.body;
    const userId = req.user.id;

    if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be positive' });
    }

    try {
        // 1. Verify Ownership of Source Account
        const isOwner = await Account.isOwner(fromAccountId, userId);
        if (!isOwner) {
            return res.status(403).json({ message: 'Access denied to source account' });
        }

        // 2. Check Balance
        const sourceAccount = await Account.findById(fromAccountId);
        if (parseFloat(sourceAccount.balance) < amount) {
            return res.status(400).json({ message: 'Insufficient funds' });
        }

        // 3. Perform Transfer (NAIVE: No Transaction)
        // Step A: Deduct from Source
        await Account.updateBalance(fromAccountId, -amount);

        // DANGER ZONE: If server crashes here, money is lost!

        // Step B: Add to Destination
        await Account.updateBalance(toAccountId, amount);

        // Step C: Record Transfer
        const transfer = await Transfer.create({ fromAccountId, toAccountId, amount });

        res.json({ message: 'Transfer successful', transfer });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during transfer' });
    }
};

exports.getMyTransfers = async (req, res) => {
    try {
        const transfers = await Transfer.findByUserId(req.user.id);
        res.json(transfers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching transfers' });
    }
};
