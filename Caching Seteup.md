# 🚀 Caching & Optimization System — Setup Guide

## New Packages to Install

```bash
npm install @upstash/redis compression
```

> `express-rate-limit`, `helmet`, `cors`, `express-mongo-sanitize` are already in your project.

---

## New / Updated Files

| File | What Changed |
|------|-------------|
| `config/redisClient.js` | NEW — Upstash Redis client |
| `middleware/cacheMiddleware.js` | NEW — Generic cache + invalidation helpers |
| `controller/productController.js` | Added cache invalidation on create/edit/delete; search + autocomplete cached in Redis |
| `controller/categoryController.js` | Added cache invalidation on create/update/delete/toggle |
| `controller/blogController.js` | Added cache invalidation on create/edit/delete |
| `routes/productRoutes.js` | `cacheMiddleware` applied to GET `/` and GET `/:id` |
| `routes/categoryRoutes.js` | `cacheMiddleware` applied to GET `/` and GET `/active` |
| `routes/blogRoutes.js` | `cacheMiddleware` applied to GET `/` and GET `/:id` |
| `index.js` | Added `compression()` middleware; rate limit reduced to 100 req/15min |

---

## Environment Variables Required

Add these to your `.env`:

```env
UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

---

## Cache Keys Reference

| Key Pattern | Data | TTL |
|-------------|------|-----|
| `products:{query}` | Product list (per query) | 3600s |
| `product:{id}` | Single product | 3600s |
| `categories` | All categories | 3600s |
| `categories:active` | Active categories | 3600s |
| `blogs:{query}` | Blog list (per query) | 3600s |
| `blog:{id}` | Single blog | 3600s |
| `search:{params}` | Search results | 600s (10 min) |
| `autocomplete:{q}` | Autocomplete suggestions | 300s (5 min) |

---

## Architecture

```
User
  ↓
Cloudflare CDN  (static assets, browser cache)
  ↓
React Frontend
  ↓
Node.js Express API
  ↓ (check cache first)
Redis — Upstash  ←→  Cache HIT → return immediately
  ↓ Cache MISS
MongoDB  →  store result in Redis  →  return response
```

---

## How Cache Invalidation Works

- **Product created/updated/deleted** → deletes `products:*` and `product:{id}`
- **Category created/updated/deleted/toggled** → deletes `categories` and `categories:active`
- **Blog created/updated/deleted** → deletes `blogs:*` and `blog:{id}`

Cache middleware is **fail-open** — if Redis is down, requests flow through to MongoDB normally.