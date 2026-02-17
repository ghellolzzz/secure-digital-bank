const Account = require('../models/accountModel');

exports.createAccount = async (req, res) => {
    try {
        const { type } = req.body;
        const userId = req.user.id;

        if (!['CHECKING', 'SAVINGS'].includes(type)) {
            return res.status(400).json({ message: 'Invalid account type. Must be CHECKING or SAVINGS.' });
        }

        const account = await Account.create({ userId, type });
        res.status(201).json({
            message: 'Account created successfully',
            account
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error creating account' });
    }
};

exports.getMyAccounts = async (req, res) => {
    try {
        const accounts = await Account.findByUserId(req.user.id);
        res.json(accounts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching accounts' });
    }
};

exports.getAccountById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const account = await Account.findById(id);

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        if (account.user_id !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(account);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching account details' });
    }
};
