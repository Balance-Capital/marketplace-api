/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const moment = require('moment');
const { expect } = require("chai");
const {
    getLastUpdateDate,
    storeExists
} = require('../services/cronSiteMap');

const { changeFreq } = require('../utils/sitemap');

const TIMEOUT = 20000

describe('SiteMap CRON', () => {

    it("getLastUpdateDate: should return the date", async (done) => {
        const testDate = moment().subtract(7,'days')
        const howManyWeeks = moment().diff(testDate, 'weeks')
        const checkDate = moment(testDate).add(howManyWeeks, 'weeks')
        const result = getLastUpdateDate(changeFreq.weekly, testDate)
        const test = moment(result).isSame(checkDate)
        expect(test).true
        done()     
    }).timeout(TIMEOUT)  

    it("storeExists: should return boolean false", async (done) => {
        storeExists('0x')
            .then((result) => {
                expect(result).false
                done()        
            })
    }).timeout(TIMEOUT) 
})