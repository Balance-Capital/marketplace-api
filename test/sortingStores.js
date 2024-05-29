/* eslint-disable no-undef */
const chai = require('chai');
const moment = require('moment');
chai.use(require('chai-http'));
const app = require('../app');

describe('sorting Stores', () => {
  let server = null;
  before((done) => {
    server = app.listen(done);
  });

  after((done) => {
    server.close(done);
  });

  it('should load page successfully', (done) => {
    chai
      .request(server)
      .get('/stores')
      .query({ sessionId: 123, limit: 44 })
      .then((res) => {
        chai.expect(res.statusCode).equal(200);
        done();
      });
  }).timeout(10000);

  it('should have priority 1', (done) => {
    chai
      .request(server)
      .get('/stores')
      .query({ sessionId: 123, limit: 44 })
      .then((res) => {
        chai.expect(res.body[0].priority).equal(1);
        done();
      });
  }).timeout(10000);

  it('should have priority 2', (done) => {
    chai
      .request(server)
      .get('/stores')
      .query({ sessionId: 123, limit: 44 })
      .then((res) => {
        const result = res.body.filter(item=>item.priority===2);
        chai.expect(result[0].priority).equal(2);
        done();
      });
  }).timeout(10000);

  it('should have priority 3', (done) => {
    chai
      .request(server)
      .get('/stores')
      .query({ sessionId: 123, limit: 44 })
      .then((res) => {
        const result = res.body.filter(item=>item.priority===3);
        chai.expect(result[0].priority).equal(3);
        done();
      });
  }).timeout(10000);

  it('should have expired offers', (done) => {
    chai
      .request(server)
      .get('/stores')
      .query({ sessionId: 123, limit: 44 })
      .then((res) => {
        const result = res.body.filter( item => {
          const validDate = moment(item.offers[0].validDate);
          return (validDate.diff(moment(), 'days') < 0) 
            ? 1
            : 0;
          });
          const validDate = moment(result[0].offers[0].validDate);
          const diff = validDate.diff(moment(), 'days');
          chai.expect(diff).lessThan(0);
          done();  
      });
  }).timeout(10000);

});
