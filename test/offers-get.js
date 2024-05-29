/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const chai = require("chai");
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const app = require('../server');

describe('Offers API', () => {

    it("good endpoint and returns status 200", (done) => {
        chai.request(app)
        .get('/offers')
        .end( (err, res) => {
           chai.expect(res).to.have.status(200);
           done();
        });        
    });  

    it("wrong endpoint and returns status 404", (done) => {
        chai.request(app)
        .get('/offer')
        .end( (err, res) => {
           chai.expect(res).to.have.status(404);
           done();
        });        
    });  

    it("wrong limit and returns status 400", (done) => {
        chai.request(app)
        .get('/offers?limit=1a')
        .end( (err, res) => {
           chai.expect(res).to.have.status(400);
           done();
        });        
    });  

    it("check content-type: json and will be json result", (done) => {
        chai.request(app)
        .get('/offers?limit=1')
        .end( (err, res) => {
           chai.expect(res).to.have.status(200);
           chai.expect(res).to.have.header('content-type', 'application/json; charset=utf-8');
           chai.expect(res).to.be.json;
           done();
        });        
    });  
})