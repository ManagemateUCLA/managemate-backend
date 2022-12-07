process.env.NODE_ENV = 'test';


const mongoose = require("mongoose");
const connectDB = require("../db");
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

process.env.NODE_ENV = 'test';


chai.use(chaiHttp);
let test_email = process.env.TEST_USER_EMAIL;
let test_password = process.env.TEST_USER_PASSWORD;
let test_name = process.env.TEST_USER_NAME;
let invalid_email = process.env.INVALID_USER_EMAIL;
let test_jwt_token = process.env.TEST_JWT_TOKEN;
let test_gid = process.env.TEST_GID;
let test_discordServerId = process.env.TEST_DISCORD_SERVER_ID;

describe('/POST Creating Spending Group', () => {
    it('Creating a spending group', (done) => {
        let body = {
            "discordUserId": "",
        }
      chai.request('http://localhost:' + PORT)
          .post('/finance/createSpendingGroup')
          .send(body)
          .end((err, res) => {
                res.should.have.status(400);
            done();
          });
    });
});

describe('/POST Add Memebr', () => {
    it('Adding a member', (done) => {
        let body = {
            "discordUserId": "",
            "members":["a", "b"]
        }
      chai.request('http://localhost:' + PORT)
          .post('/finance/addMembers')
          .send(body)
          .end((err, res) => {
                res.should.have.status(200);
            done();
          });
    });
});

describe('/POST Record a Transaction', () => {
    it('Transaction requires a title', (done) => {
        let transaction = {
            "amount": 60,
            "lender": "t1",
            "borrowers": ["t2", "t3", "t4"],
            "discordUserId": test_gid
        }
      chai.request('http://localhost:' + PORT)
          .post('/finance/recordTransaction')
          .send(body)
          .end((err, res) => {
                res.should.have.status(400);
            done();
          });
    });

    it('Transaction requires an amount', (done) => {
        let transaction = {
            "title": "Test",
            "lender": "t1",
            "borrowers": ["t2", "t3", "t4"],
            "discordUserId": test_gid
        }
      chai.request('http://localhost:' + PORT)
          .post('/finance/recordTransaction')
          .send(body)
          .end((err, res) => {
                res.should.have.status(400);
            done();
          });
    });

    it('Transaction requires a discordServerId', (done) => {
        let transaction = {
            "title": "Test",
            "amount": 60,
            "lender": "t1",
            "borrowers": ["t2", "t3", "t4"],
        }
      chai.request('http://localhost:' + PORT)
          .post('/finance/recordTransaction')
          .send(body)
          .end((err, res) => {
                res.should.have.status(400);
            done();
          });
    });
});
