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

describe('/POST Create chore', () => {

    it('Creating a chore without a name', (done) => {
        let chore = { 
            'duration': 30,
            'preferred_days': ["Monday"],
        };
    
        chai.request('http://localhost:3000')
            .post('/calendar/ABCDEF/createChore')
            .send(chore)
            .end((err, res) => {
                res.should.have.status(400);
                done();
          })
    })


    it('Successfully creating a chore', (done)=> {
        let chore = { 
            'duration': 30,
            'preferred_days': ["Monday"],
            'name': 'Test'
        };
    
        chai.request('http://localhost:3000')
            .post('/calendar/U6EXG/createchore') // using a test group
            .send(chore)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            })
    })
})

describe('/GET Get calendar', () => {
    it('Get scheduled calendar based on chores', (done)=> {
        chai.request('http://localhost:3000')
            .get('/calendar/U6EXG/getCalendar')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            })
    })
})