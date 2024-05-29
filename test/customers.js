/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const chai = require("chai");
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const app = require('../server');

describe('Customers API', () => {

    it("good endpoint and returns status 200", (done) => {
        chai.request(app)
        .get('/customers')
        .end( (err, res) => {
           chai.expect(res).to.have.status(200);
           done();
        });        
    });  

    it("wrong endpoint and returns status 404", (done) => {
        chai.request(app)
        .get('/customer')
        .end( (err, res) => {
           chai.expect(res).to.have.status(404);
           done();
        });        
    });  

})