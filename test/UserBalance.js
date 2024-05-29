/* eslint-disable no-undef */
const chai = require("chai");
const crypto = require('crypto');
const moment = require('moment');
const { 
    BALANCE_OPERATION_DEPOSIT, 
    BALANCE_OPERATION_WITHDRAW
} = require('../constants/user');
const db = require('../models/index');

describe('User Balance', () => {
    let userId;

    before(async () => {
        const secret = crypto.createHash("sha256").update('secret').digest("hex");
        const cookieId = '1803e9c4-582f-427b-ab79-e098a1fbd011';
        
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
    });

    after(() => {
        db.models.Users.deleteOne({_id: userId}).exec();
    });

    it("set user balance account + 10 operation deposit", async () => {
        const balance = await db.models.Users.changeBalance(10, userId, BALANCE_OPERATION_DEPOSIT, moment());
        chai.expect(balance).equal(10);
    });  

    it("set user balance account - 5 operation withdraw", async () => {
        const balance = await db.models.Users.changeBalance(5, userId, BALANCE_OPERATION_WITHDRAW, moment());
        chai.expect(balance).equal(5);
    });  

})