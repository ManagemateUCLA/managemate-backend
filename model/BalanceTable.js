const mongoose = require('mongoose');

const balanceTableSchema = new mongoose.Schema(
    {
        gid: {
            type: String,
            required: true,
            unqiue: true
        },
        table: {
            type: Map,
            of: Object
        }
    }
);

module.exports = mongoose.model('BalanceTable', balanceTableSchema);