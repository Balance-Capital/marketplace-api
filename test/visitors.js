/* eslint-disable no-undef */
const chai = require("chai");
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const server = require('../server');
const db = require('../models/index');

describe('Visitors', () => {
    const cookieId = '1803e9c4-582f-427b-ab79-e098a1fbd011';

    it("check visitors trackerId, status should be 200", (done) => {
        chai.request(server)
        .get(`/stores?limit=44&sessionId=${cookieId}`)
        .end( (err, res) => {
           chai.expect(res).to.have.status(200);
           done();
        });        
    });  

    it('responds with matching records', (done) => {
        db.models.Visitors.find({
            cookieId
        })
        .exec()
        .then((visitor) => {
            chai.expect(visitor).to.have.length(1);
            done();
        });
    });    

})