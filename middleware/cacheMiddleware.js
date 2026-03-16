const redis = require('../config/redisClient');

/**
 * Generic cache middleware factory
 * @param {string|Function} keyFn - static key string or function(req) returning key
 * @param {number} ttl - TTL in seconds (default 3600)
 */
const cacheMiddleware = (keyFn, ttl = 3600) => {
  return async (req, res, next) => {
    try {
      const cacheKey = typeof keyFn === 'function' ? keyFn(req) : keyFn;

      const cached = await redis.get(cacheKey);

      if (cached) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.status(200).json({
          success: true,
          fromCache: true,
          ...cached,
        });
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Intercept res.json to store response in Redis
      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        try {
          if (body && body.success) {
            await redis.set(cacheKey, body, { ex: ttl });
            console.log(`💾 Cached: ${cacheKey} (TTL: ${ttl}s)`);
          }
        } catch (err) {
          console.error('❌ Redis SET error:', err.message);
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error('❌ Cache middleware error:', err.message);
      next(); // fail open — don't block request
    }
  };
};

/**
 * Invalidate one or more cache keys
 * @param {...string} keys
 */
const invalidateCache = async (...keys) => {
  try {
    await Promise.all(keys.map((key) => redis.del(key)));
    console.log(`🗑️  Cache invalidated: ${keys.join(', ')}`);
  } catch (err) {
    console.error('❌ Cache invalidation error:', err.message);
  }
};

module.exports = { cacheMiddleware, invalidateCache };