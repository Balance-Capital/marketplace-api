/* eslint-disable no-undef */
const chai = require("chai");
const chaiHttp = require('chai-http');
// const moment = require('moment');

chai.use(chaiHttp);
const { getOrCreateUser } = require('../controllers/UsersController');
const server = require('../server');
const db = require('../models/index');

// const withdrawController = require('../controllers/WithdrawController');

const commissionsReport = require('./data/unifycommissionreports.json');
const commissionReferralsReport = require('./data/referrals.json');

describe('withdraw controller', () => {
    let userId;
    let userToken;
    let referralId;
    const cookieId = '1803e9c4-582f-427b-ab79-e098a1fbd011';
    const username = 'username@test.com'; 
    const secret = 'secret';

    before(async () => {
        const walletAddress = null; 
        const remoteAddressIp = '127.0.0.1'; 
        const email = username; 
        displayName = 'displayName'; 
        externalId = '1156512274467496699991100'; 
        externalProviderName = 'test'; 
        referralCode = null;        
        const newUser = await getOrCreateUser(
            cookieId, 
            username, 
            secret, 
            walletAddress, 
            remoteAddressIp, 
            email, 
            displayName, 
            externalId, 
            externalProviderName, 
            referralCode
        );
        userId = newUser.id;
        referralId = await db.models.Referrals.insertMany(commissionReferralsReport).then((inserted) => inserted);
    });

    after(async () => {
        await db.models.Users.deleteOne({_id: userId}).exec();
        await db.models.Users.deleteOne({_id: userId}).exec();
    });

    it("login", (done) => {
        chai.request(server)
        .post(`/auth/login/email/ext`)
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({username,password:secret})
        .end( (err, res) => {
            userToken = res.body?.token;
           chai.expect(res).to.have.status(200);
           done();
        });        
    }); 

    it("check commission report", (done) => {
        chai.request(server)
        .get(`/affiliate-dashboard`)
        .set('content-type', 'application/json')
        .set('authorization',`Bearer ${userToken}`)
        .end( (err, res) => {
            const {body} = res;
            console.log(body);
           chai.expect(res).to.have.status(200);
           done();
        });        
    }); 

    it("check commission report", (done) => {
        chai.request(server)
        .get(`/affiliate-dashboard`)
        .set('content-type', 'application/json')
        .set('authorization',`Bearer ${userToken}`)
        .end( (err, res) => {
            const {body} = res;
            console.log(body);
           chai.expect(res).to.have.status(200);
           done();
        });        
    });     

})