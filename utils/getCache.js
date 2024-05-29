const {
    REDIS_CACHE_CONFIG
} = require('../constants/cacheKeyNames');
  
const {
    CACHE_DEFAULT_EXPIRE
} = require('../constants/cacheDefaultExpire');
  
const logger = require('../services/logger');
const { redisConnection } = require('../services/cacheRedis');

/**
 * Retrieves data from a cache using Redis.
 * @param {object} queryBuilder - The query builder object used to build the query.
 * @param {object} redisModelCache - The Redis model cache object used to retrieve cache data.
 * @param {string} keyCacheName - The name of the cache key used to retrieve specific cache data.
 * @returns {object} - The query builder object, either with the cache set or without.
 */
const getCache = async (queryBuilder, redisModelCache, keyCacheName) => {
  try {
    // Check if there is a connection to Redis
    if (!redisConnection()) {
      return queryBuilder?.exec();
    }

    // Check if the query builder or the Redis model cache is not provided
    if (!queryBuilder || !redisModelCache) {
      return null;
    }

    // Retrieve the cache expiration time from the Redis model cache
    const cacheExpire = await redisModelCache
      .find({ name: REDIS_CACHE_CONFIG })
      .cache({ key: REDIS_CACHE_CONFIG, expire: CACHE_DEFAULT_EXPIRE })
      .limit(1)
      .exec()
      .catch((error) => logger.warning(`[getCache] cacheExpire ${error?.message}`, error))
      .then((result) => result[0]?.expire || CACHE_DEFAULT_EXPIRE);

    // Retrieve the cache data from the Redis model cache
    const cache = await redisModelCache
      .find({ name: keyCacheName })
      .cache({ key: REDIS_CACHE_CONFIG, expire: cacheExpire })
      .limit(1)
      .exec()
      .then((result) => result[0])
      .catch((error) => logger.warning(`[getCache] redisModelCache ${error?.message}`, error));

    // Set the cache on the query builder if it is active
    if (cache?.active) {
      queryBuilder.cache({ key: cache.name, expire: cache.expire });
    }
  } catch (error) {
    logger.warning(`[getCache] catch ${error?.message}`, error);
  }

  return queryBuilder;
};

module.exports = {
    getCache
};