const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
       
        title: {
            type: String,
            required: true,
            min: 1,
            max: 255
        },
        amount: {
            type: Number,
            required: true,
        },
        lender: {
            type: String,
            required: true,
            min: 1, 
            max: 255
        },
        borrowers: {
            type: [String],
            required: true
        },
        gid: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports = mongoose.model('Transaction', transactionSchema);