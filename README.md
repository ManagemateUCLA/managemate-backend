# Managemate Backend

## Setup
After cloning the repo, ensure that you have npm (node package manager) installed.

After that, enter the project repo and run:
```bash
npm install
npm start
```
Note that you will need a .ENV file in the same repository as follows:
```txt
DB_CONNECTION= <connection string for MongoDB>
TOKEN_SECRET= <token secret for MongoDB>
CLIENT_ID= <google calendar api client id>
CLIENT_SECRET= <google calendar api client secret>
REDIRECT_URI=http://localhost:3000/authorizedCalendar
PORT=3000
```

This will run the backend on localhost:3000
## Repository Structure

```
.
├── README.md
├── constants.js
├── db.js               #  to connect to mongoDB
├── docs/               #  OpenAPI files
├── helpers/            #  helper files
├── index.js            #  entrypoint for backend
├── model/              #  Mongoose models for MongoDB collections
├── package-lock.json   
├── package.json
├── routes/             # Files that handle different routes from index.js
│   ├── auth.js
│   ├── bulletinBoard.js
│   ├── calendar.js
│   ├── finance.js
│   ├── roommateGroup.js
│   ├── user.js             
│   └── verifyJWTToken.js       
├── test/               #  test scripts
└── validation/         #  authentication functions
```

