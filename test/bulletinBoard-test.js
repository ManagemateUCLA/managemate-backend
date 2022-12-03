process.env.NODE_ENV = 'test';


const mongoose = require("mongoose");
const connectDB = require("../db");
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

chai.use(chaiHttp);
let test_email = process.env.TEST_USER_EMAIL;
let test_password = process.env.TEST_USER_PASSWORD;
let test_name = process.env.TEST_USER_NAME;
let invalid_email = process.env.INVALID_USER_EMAIL;
let test_jwt_token = process.env.TEST_JWT_TOKEN;
let test_gid = process.env.TEST_GID;
let test_discord_server_id = process.env.TEST_DISCORD_SERVER_ID
let test_discord_user_id = process.env.TEST_DISCORD_USER_ID

let eventID = null;


describe('/GET BulletinBoard', () => {
    it('test jwt token is needed to get bulletin board info', (done) => {
      chai.request('http://localhost:3000')
          .get('/bulletinBoard/')
          .end((err, res) => {
                res.should.have.status(401);
            done();
          });
    });
});

describe('/GET BulletinBoard', () => {
    it('test jwt token gives us bulletin board info', (done) => {
      chai.request('http://localhost:3000')
          .get('/bulletinBoard/')
          .set('auth-token', test_jwt_token)
          .end((err, res) => {
                res.should.have.status(200);
            done();
          });
    });
});

describe('/POST BulletinBoard', () => {
    it('need discord user id and discord server id needed to get bulletin board info', (done) => {
        let group = {
        }
      chai.request('http://localhost:3000')
          .post('/bulletinBoard/')
          .set('auth-token', test_jwt_token)
          .send(group)
          .end((err, res) => {
                res.should.have.status(403);
            done();
          });
    });
});

describe('/POST BulletinBoard', () => {
    it('getting bulletin board info', (done) => {
        let details = {
            "discordServerId": test_discord_server_id,
            "discordUserId": test_discord_user_id
        }
      chai.request('http://localhost:3000')
          .post('/bulletinBoard/')
          .send(details)
          .end((err, res) => {
                console.log("details", details);
                res.should.have.status(200);
            done();
          });
    });
});



describe('/POST Bulletin Board Adding Message', () => {
    it('adding event needs discord user id, server id and a message', (done) => {
        let discordDeets = {
        }
      chai.request('http://localhost:3000')
          .post('/bulletinBoard/addEvent')
          .send(discordDeets)
          .end((err, res) => {
                res.should.have.status(403);
            done();
          });
    });
});

describe('/POST Bulletin Board Adding Message', () => {
    it('adding event with proper info', (done) => {
        let details = {
            "discordServerId": test_discord_server_id,
            "discordUserId": test_discord_user_id,
            "message": "tester"
        }
      chai.request('http://localhost:3000')
          .post('/bulletinBoard/addEvent')
          .send(details)
          .end((err, res) => {
                res.should.have.status(200);
            done();
          });
    });
});


describe('/POST Bulletin Board deleting Message', () => {
    it('deleting event needs discord user id, server id and an event id', (done) => {
        let discordDeets = {
        }
      chai.request('http://localhost:3000')
          .delete('/bulletinBoard/deleteEvent')
          .send(discordDeets)
          .end((err, res) => {
                res.should.have.status(403);
            done();
          });
    });
});