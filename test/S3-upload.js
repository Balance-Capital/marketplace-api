/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const chai = require("chai");
const chaiHttp = require('chai-http');
const fs = require('fs');

chai.use(chaiHttp);

// Import module you are going to test
const uploadFileToS3 = require('../services/s3');

describe('Upload files to S3', () => {

  it('upload', (done) => {
    const formData = {
      image: fs.createReadStream(`${process.cwd()}/test/files/test.jpg`)
    };

    uploadFileToS3('api/images/test.jpg', formData.image);    
    expect(result).equal('success');
    done();

  });
});