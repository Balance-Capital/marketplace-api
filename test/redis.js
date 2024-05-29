/* eslint-disable no-undef */
const { expect } = require("chai");
const { redisClient } = require('../services/cacheRedis');

describe("RedisTest", () => {

  it("should set and retrieve values from Redis", async (done) => {
    await redisClient.hset('hashKey', 'key');
    redisClient.expire('hashKey', 5000);
    const value = await redisClient.hget('hashKey', 'key');
    expect(value).is.equal('val');
    done();  
  }).timeout(10000);

});