/* eslint-disable no-undef */
const { expect } = require("chai");

const { generateReferralsId } = require('../controllers/UsersController');

describe('Referral Id', () => {

    it("should be a 10 chars length", (done) => {
        expect(generateReferralsId()).length(10);
        done();
    });  

})