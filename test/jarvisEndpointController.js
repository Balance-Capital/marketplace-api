/* eslint-disable no-undef */
const { expect } = require("chai");
const { getData, pickUpText, prepareResponse } = require('../controllers/JarvisEndpointsController');

describe('JarvisEndpointController', () => {

    it("prepareResponse, should be an object and have companyInformation property", (done) => {
        prepareResponse().then((result) => {
            expect(result).to.be.an('object').that.have.property('companyInformation');
            done();
        });
    }).timeout(20000);  

    it("get data, should be an object", (done) => {
        getData().then((result) => {
            expect(result).to.be.an('object')
            done();
        });
    }).timeout(20000);  

    it("pickUpText, should be a string", (done) => {
        const domain = 'ebay.com';
        pickUpText(domain).then((result) => {
            expect(result).to.be.a('string');
            done();
        });
    }).timeout(20000);  

})