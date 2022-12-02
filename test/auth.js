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

describe('/POST Register User', () => {
    it('Registering a user requires name', (done) => {
        let user = {
            "email": test_email,
            "password": test_password
        }
      chai.request('http://localhost:3000')
          .post('/auth/register')
          .send(user)
          .end((err, res) => {
                res.should.have.status(400);
                res.text.should.be.eq('"name" is required');
            done();
          });
    });

    it('Email of a new user must be unique', (done) => {
        let user = {
            "email": test_email,
            "password": test_password,
            "name": test_name,
            "discordUserId":"Test#123"
        }
      chai.request('http://localhost:3000')
          .post('/auth/register')
          .send(user)
          .end((err, res) => {
                res.should.have.status(400);
                res.text.should.be.eq('Email already exists');
            done();
          });
    });
});

describe('/POST Login User', () => {
    it('Succesfully logs in user with correct credentials', (done) => {
        let user = {
            "email": test_email,
            "password": test_password
        }
      chai.request('http://localhost:3000')
          .post('/auth/login')
          .send(user)
          .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('token');
            done();
          });
    });

    it('Returns error for users that are not registered', (done) => {
        let user = {
            "email": invalid_email,
            "password": test_password,
        }
      chai.request('http://localhost:3000')
          .post('/auth/login')
          .send(user)
          .end((err, res) => {
                res.should.have.status(401);
                res.text.should.be.eq('User is not registered');
            done();
          });
    });
});

describe('/POST Roommate Group create', () => {
    it('Group name is required to create group', (done) => {
        let group = {
        }
      chai.request('http://localhost:3000')
          .post('/roommateGroup/create')
          .set('auth-token', test_jwt_token)
          .send(group)
          .end((err, res) => {
                res.should.have.status(400);
                res.text.should.be.eq('Group name is required to create group');
            done();
          });
    });

    it('Group gets created successfully', (done) => {
        let group = {
            "groupName": "TEST GROUP",
        }
      chai.request('http://localhost:3000')
          .post('/roommateGroup/create')
          .set('auth-token', test_jwt_token)
          .send(group)
          .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('gid');
            done();
          });
    });
});

describe('/POST Roommate Group join', () => {
    it('GID is required to join group', (done) => {
        let group = {
        }
      chai.request('http://localhost:3000')
          .post('/roommateGroup/join')
          .set('auth-token', test_jwt_token)
          .send(group)
          .end((err, res) => {
                res.should.have.status(400);
                res.text.should.be.eq('GID is required to join group');
            done();
          });
    });
});