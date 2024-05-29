/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const chai = require("chai");
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const app = require('../server');

describe('Offers API', () => {

    it("create offer", (done) => {
        const data = [
            {
                'verified': false, // if the offer has been verified
                'validDate': '2021-04-13T22:00:00.000+00:00', // expired date
                'startDate': '2021-03-14T23:00:00.000+00:00',// the date from which the offer will be available
                'value': 10, // for instance 10
                'valueType': 'percentage', // Enum: currency or percentage
                'currency': null, // $ or pound or euro etc
                'countryCode': 'US',
                'image': 'https://static.skimlinks.com/images/merchant_logos/mid417355_1549472459.jpg', // name of file
                'savingType': '', // what kind of saving is it, free shipping etc
                'storeUrl': '', // redirect link to our store page
                'title': 'Hot product: storewide',
                'description': 'Woot! is a daily deals site offering incredible deals across home products, electronics, tech, sports, tools, apparel and much more. We specialize in curating select products every day to offer the deepest discounts possible.',
                'code': 'WIN10', // for instance M10 or WIN20
                'origin': 'thriftbooks.com', // partner whom it came from
                'originId': 1218016, // unique partner’s offer id
                'redirectUrl': 'https://www.woot.com/wootoff?skimoffer=1218016' // external redirect          
            }
        ];

        chai.request(app)
        .post('/offers')
        .send(data)
        .end( (err, res) => {
           chai.expect(res).to.have.status(200);
           done();
        });        
    });  

})