/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const chai = require("chai");
const chaiHttp = require('chai-http');
const db = require('../models/index');

chai.use(chaiHttp);
const app = require('../server');

describe('User create', () => {
    const sessionId = '1803e9c4-582f-427b-ab79-e098a1fbd011';

    const post = {
        username: 'tytus',
        secret: 'tytus',
        email: undefined,
        phone: undefined,
        wallet: undefined,
        firstname: undefined,
        lastname: undefined,
        sessionId
    };

    after(() => {
        db.models.Users.deleteOne({cookieId: sessionId}).exec();
    });

    it("should be a status 200", (done) => {
        chai.request(app)
        .post('/users')
        .send(post)
        .end((err, res) => {
            chai.expect(res).to.have.status(200);
            done();
        });        
    });  

    it("should be a status 409", (done) => {
        chai.request(app)
        .post('/users')
        .send(post)
        .end((err, res) => {
            chai.expect(res).to.have.status(409);
            done();
        });        
    });  

})