/* eslint-disable no-undef */
const chai = require("chai");
const crypto = require('crypto');
const db = require('../models/index');
const { userBalanceReportMatching } = require('../services/skimLinksReportCommissionGet');
const data = require('./data/ReportCommissionUnifyAffiliateSystem.json');

describe('Commission Report - Matching items', () => {
    const cookieId = '1803e9c4-582f-427b-ab79-e098a1fbd011';
    let userId;
    let reports;

    before(async() => {
        const secret = crypto.createHash("sha256").update('secret').digest("hex");
        
        const newUser = new db.models.Users({
            secret,
            cookieId,
            userName: 'test',
            lastname: 'user',
            email: null,
            phone: null,
            wallet: null,
            firstname: null
        });
        userId = (await db.models.Users.create(newUser)).id;        
        await db.models.ReportCommissionUnifyAffiliateSystem.insertMany(data);
        reports = await db.models.ReportCommissionUnifyAffiliateSystem.find({}).exec();
    });

    after(() => {
        db.models.Users.deleteOne({_id: userId}).exec();
        db.models.ReportCommissionUnifyAffiliateSystem.deleteMany().exec();
    });

    it("matching entry report with users test paid, should return true", async (done) => {
        const paid = reports.filter((item) => item.transaction_details.payment_status === 'paid')[0];
        const match = await userBalanceReportMatching(paid);
        chai.expect(match).to.be.true();
        done();
    });  

    it("matching entry report with users test unpaid, should return false", async (done) => {
        const unpaid = reports.filter((item) => item.transaction_details.payment_status === 'unpaid')[0];
        const match = await userBalanceReportMatching(unpaid);
        chai.expect(match).to.be.false();
        done();
    });  

    it("matching entry report with users test duplicate, should return false", async (done) => {
        const paid = reports.filter((item) => item.transaction_details.payment_status === 'paid')[0];
        const match = await userBalanceReportMatching(paid);
        chai.expect(match).to.be.false();
        done();
    });  

})