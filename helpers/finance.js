// helper functions 
function getRow(matrix, i) {
    return matrix[i];
}

function getColumn(matrix, i) {
    return matrix.map(matrix => matrix[i]);
}

function getSum(arr) {
    return arr.reduce((partialSum, a) => partialSum + a, 0);
}

function getIntersection(setA, setB) {
    const intersection = new Set(
      [...setA].filter(element => setB.has(element))
    );
  
    return intersection;
}

function firstPositiveElemIndex(arr) {
    for(let i = 0; i < arr.length; i++) {
        if (arr[i] > 0) {
            return i;
        }
    }
    return -1;
}

function getBalance(creditor, debitor, matrix) {
    return matrix[creditor][debitor]
}

function updateBalance(creditor, debitor, amount, matrix) {
    matrix[creditor][debitor] += amount
	return matrix
}

function getPositiveIndexes(array) {
    return array                      
        .map((v, i) => v <= 0 ? -1 : i) 
        .filter(i => i + 1);          
}

function getCommonDebitors(debitors1, debitors2, matrix) {
    let row1 = getPositiveIndexes(getRow(matrix, debitors1)); 
    let row2 = getPositiveIndexes(getRow(matrix, debitors2)); 

    let db1_indexes = new Set(row1);
    let db2_indexes = new Set(row2);

    return Array.from(getIntersection(db1_indexes, db2_indexes));
}

function removeRedundancy(matrix) {
    let start = 0
    for(let i = 0; i < matrix.length; i++) {
        for(let j = start; j < matrix.length; j++) {
            if(matrix[i][j] >= matrix[j][i]) {
                matrix[i][j] = matrix[i][j] - matrix[j][i]
                matrix[j][i] = 0
            }
            else {
                matrix[j][i] = matrix[j][i] - matrix[i][j]
                matrix[i][j] = 0
            }
        }
        start += 1;
    }   
    return matrix;
}

function makeGraphBipartite(matrix) {
    matrix = removeRedundancy(matrix);
    for(let i = 0; i < matrix.length; i++) {
        if(getSum(getRow(matrix, i)) == 0 || getSum(getColumn(matrix, i)) == 0) {
			continue;
        }
        
        while (getSum(getRow(matrix, i)) != 0 && getSum(getColumn(matrix, i)) != 0) {
            let debitor = firstPositiveElemIndex(getRow(matrix, i));
			let creditor = firstPositiveElemIndex(getColumn(matrix, i));
            let debit_value = getBalance(i, debitor, matrix);
			let credit_value = getBalance(creditor, i, matrix);
            if(debit_value >= credit_value) { // in this pair I recieve more money than I pay
				// here I am getting money from debitor and paying creditor
				matrix = updateBalance(i, debitor, -1*credit_value, matrix);
				matrix = updateBalance(creditor, i, -1*credit_value, matrix);

				// now my debitor will pay the difference to my creditor
				matrix = updateBalance(creditor, debitor, credit_value, matrix);
            }
			else { // in this pair I pay more money than I recieve
				matrix = updateBalance(creditor, i, -1*debit_value, matrix);
				matrix = updateBalance(i, debitor, -1*debit_value, matrix);

				matrix = updateBalance(creditor, debitor, debit_value, matrix);
            }
        }
        matrix = removeRedundancy(matrix);
    }
    return matrix;
}

function simplifyHourglassTransactions(matrix) {
    let start = 1;
    for(let i = 0; i < matrix.length; i++) {
        for(let j = start; j < matrix.length; j++) {
            let common_debitors = getCommonDebitors(i, j, matrix);
            if(common_debitors.length > 1) {
				while(common_debitors.length > 1) {
					db1 = common_debitors[0];
					db2 = common_debitors[1];
					c1 = i;
					c2 = j;

					db1_to_c1 = getBalance(c1, db1, matrix);
					db1_to_c2 = getBalance(c2, db1, matrix);
					db2_to_c1 = getBalance(c1, db2, matrix);
					db2_to_c2 = getBalance(c2, db2, matrix);

					if(db1_to_c1 == db2_to_c2) {
						matrix = updateBalance(c1, db2, db2_to_c2, matrix);
						matrix = updateBalance(c2, db1, db1_to_c1, matrix);
						matrix = updateBalance(c1, db1, -1*db1_to_c1, matrix);
						matrix = updateBalance(c2, db2, -1*db2_to_c2, matrix);
                    }
					else if(db2_to_c1 == db1_to_c2) {
						matrix = updateBalance(c1, db1, db2_to_c1, matrix);
						matrix = updateBalance(c2, db2, db1_to_c2, matrix);
						matrix = updateBalance(c1, db2, -1*db2_to_c1, matrix);
						matrix = updateBalance(c2, db1, -1*db1_to_c2, matrix);
                    }
                    else if(db1_to_c1 < db2_to_c2) {
						matrix = updateBalance(c1, db1, -1*db1_to_c1, matrix);
						matrix = updateBalance(c2, db2, -1*db1_to_c1, matrix);
						matrix = updateBalance(c1, db2, db1_to_c1, matrix);
						matrix = updateBalance(c2, db1, db1_to_c1, matrix);
                    }
                    else {
						matrix = updateBalance(c2, db2, -1*db2_to_c2, matrix);
						matrix = updateBalance(c1, db1, -1*db2_to_c2, matrix);
						matrix = updateBalance(c1, db2, db2_to_c2, matrix);
						matrix = updateBalance(c2, db1, db2_to_c2, matrix);
                    }
					common_debitors = getCommonDebitors(i, j, matrix);
                }
            }
        }
        start += 1;
    }
    return matrix;
}

// let matrix = [
//     [0, 0, 0, 0, 0], 
//     [0, 0, 0, 0, 0], 
//     [0, 0, 0, 0, 0],
//     [10, 20, 40, 0, 0],
//     [30, 40, 45, 0, 0]
// ];

// console.log(simplifyHourglassTransactions(makeGraphBipartite(matrix)));
// console.log(getColumn(matrix, 0));
function getUnitTransactions (lender, borrowers, amount, type) {
    let unitTransactions = [];
    let numBorrowers = borrowers.length;
    let splitAmount = amount / parseFloat(numBorrowers);
    for(let i = 0; i < numBorrowers; i++) {
        let unitTransaction = {}
        if(type == "add") {
            const unitTransaction = {
                lender: lender,
                borrower: borrowers[i],
                amount: splitAmount
            };
        }
        else if(type == "delete") {
            const unitTransaction = {
                lender: borrowers[i],
                borrower: lender,
                amount: splitAmount
            };
        }
        unitTransactions.push(unitTransaction);
    }
    return unitTransactions;
}


function simplifyDebts (spendingTable, lender, borrowers, amount, type) {
    let unitTransactions = getUnitTransactions(lender, borrowers, amount, type);
    // create a 2D array of transactions 
    var balanceArray = []

    // create a user to index map 
    var userToIndex = new Map();
    var indexToUser = new Map();
    let numMembers = spendingTable.size;

    var index = 0;
    for (let [key, value] of spendingTable) {
        userToIndex.set(key, index);
        indexToUser.set(index, key);
        let arr = Array(numMembers);
        arr.fill(0);
        balanceArray.push(arr);
        index += 1;
    }

    // initialize balance array 
    for (let [okey, value] of spendingTable) {
        let i = userToIndex.get(okey);
        let valueMap = new Map(Object.entries(value));
        for (let [ikey, value] of valueMap) {
            let j = userToIndex.get(ikey);
            balanceArray[i][j] = value;
        }
    }

    // update transactions in balance array 
    for (let obj of unitTransactions) {
        let i = userToIndex.get(obj.lender);
        let j = userToIndex.get(obj.borrower);
        if(i != j)
            balanceArray[i][j] += obj.amount;
    }

    // simplify debts 
    balanceArray = makeGraphBipartite(balanceArray);
    balanceArray = simplifyHourglassTransactions(balanceArray);

    // create balance map
    let balanceMap = new Map();
    for (let i = 0; i < balanceArray.length; i++) {
        let balances = new Map();
        let creditor = indexToUser.get(i);
        for (let j = 0; j < balanceArray.length; j++) {
            let debitor = indexToUser.get(j);
            if(balanceArray[i][j] > 0) {
                balances.set(debitor, balanceArray[i][j]);
            }
        }
        balanceMap.set(creditor, balances);
    }
    return balanceMap;
}

module.exports.simplifyDebts = simplifyDebts;