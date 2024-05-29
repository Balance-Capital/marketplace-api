/* eslint-disable no-undef */
const { expect } = require("chai");
const { getOriginDomain } = require('../utils/getOriginDomain');

describe("getOriginDomain", () => {
    
    it('should return valid domain', (done) => {
        const domain = 'dot.fm';
        const validDomain = 'dot.fm';
        const check = getOriginDomain(domain);
        expect(check).is.equal(validDomain);
        done();
    })

});