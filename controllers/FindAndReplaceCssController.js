/* eslint-disable no-underscore-dangle */
const { validationResult } = require('express-validator');

const ACCESS_TOKEN = process.env.API_ACCESS_TOKEN || null;

const { findAndReplaceTool } = require('../utils/findAndReplaceTool');

const post = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  };

  if(req.query.token !== ACCESS_TOKEN) {
    res.json('wrong token');
    return;
  };

  const {queryField, findWhat, findWhere, replaceWhat, test } = req.body;
  
  const parameters = {
    queryField, 
    findWhat, 
    findWhere, 
    replaceWhat, 
    test: test 
      ? Boolean(test === 'true')
      : true
  }
  findAndReplaceTool(parameters).then((changing) => {
    res.json(changing);
  });
  
}

module.exports = { post }
