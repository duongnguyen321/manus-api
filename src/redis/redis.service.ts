import timer from '@/common/helpers/timer.helper';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get('REDIS_URL');
    const option = redisUrl
      ? {
          url: this.configService.get('REDIS_URL'),
        }
      : undefined;
    this.client = createClient(option);
    this.client.on('error', (err) => console.error('Redis Client Error', err));
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  getClient() {
    return this.client;
  }

  /**
   * Sets a key-value pair in Redis with TTL.
   * @param {string} key The key to set.
   * @param {string} value The value to set.
   * @param {number | string} ttl Time to live for the key, can be a number (in seconds) or a string (e.g., "2 days"). Defaults to the instance's default TTL.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async set(key: string, value: string, ttl: number | string): Promise<void> {
    const effectiveTTL = typeof ttl === 'string' ? timer(ttl) : ttl;
    await this.client.setEx(key, effectiveTTL, value);
  }

  /**
   * Retrieves the value of a key from Redis.
   * @param {string} key The key to retrieve.
   * @returns {Promise<string | null>} A promise that resolves with the value of the key or null if the key does not exist.
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * Deletes a key from Redis.
   * @param {string} key The key to delete.
   * @returns {Promise<number>} A promise that resolves with the number of keys that were deleted.
   */
  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  /**
   * Caches data or retrieves it from the cache if already stored, with an TTL.
   * @param {string} key The cache key.
   * @param {() => Promise<T>} callback A callback that returns the data to cache if not already cached.
   * @param {number | string} ttl Time to live for the key, can be a number (in seconds) or a string (e.g., "1 month"). Defaults to the instance's default TTL.
   * @returns {Promise<T>} A promise that resolves with cached data or the result of the callback function.
   */
  async cached<T>(
    key: string,
    ttl: number | string,
    callback: () => Promise<T> | T,
  ): Promise<T> {
    const cachedValue = await this.get(key);
    if (cachedValue) {
      return JSON.parse(cachedValue) as T;
    } else {
      const data: T = await callback();
      if (data) {
        const effectiveTTL = typeof ttl === 'string' ? timer(ttl) : ttl;
        await this.set(key, JSON.stringify(data), effectiveTTL);
      }
      return data;
    }
  }

  /**
   * Deletes all keys in the Redis database.
   * @returns {Promise<void>} A promise that resolves when all keys have been deleted.
   */
  async deleteAll(): Promise<void> {
    const keys = await this.client.keys('*');
    await Promise.all(keys.map((key) => this.del(key)));
  }

  /**
   * Deletes keys matching a pattern.
   * @param {string} pattern The pattern to match keys against.
   * @returns {Promise<number>} A promise that resolves with the total number of keys deleted.
   */
  async delPattern(pattern: string): Promise<number> {
    let cursor = 0;
    let totalDeleted = 0;

    do {
      const found = await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      const { keys, cursor: newCursor } = found;
      cursor = +newCursor;
      if (keys.length) {
        const deleted = await this.client.del(keys);
        totalDeleted += deleted;
      }
    } while (cursor !== 0);

    return totalDeleted;
  }

  /**
   * Sets a key-value pair with TTL (alias for set method for backward compatibility).
   * @param {string} key The key to set.
   * @param {number} ttl Time to live in seconds.
   * @param {string} value The value to set.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async setex(key: string, ttl: number, value: string): Promise<void> {
    await this.client.setEx(key, ttl, value);
  }

  /**
   * Increments the value of a key by 1.
   * @param {string} key The key to increment.
   * @returns {Promise<number>} A promise that resolves with the new value after increment.
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * Sets the expiration time for a key.
   * @param {string} key The key to set expiration for.
   * @param {number} seconds The number of seconds until expiration.
   * @returns {Promise<boolean>} A promise that resolves with true if the timeout was set.
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    return this.client.expire(key, seconds);
  }

  /**
   * Gets a range of elements from a list.
   * @param {string} key The key of the list.
   * @param {number} start The start index.
   * @param {number} stop The stop index.
   * @returns {Promise<string[]>} A promise that resolves with the list elements.
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lRange(key, start, stop);
  }

  /**
   * Finds all keys matching a pattern.
   * @param {string} pattern The pattern to match keys against.
   * @returns {Promise<string[]>} A promise that resolves with matching keys.
   */
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  /**
   * Pushes values to the left end of a list.
   * @param {string} key The key of the list.
   * @param {string | string[]} values The values to push.
   * @returns {Promise<number>} A promise that resolves with the new length of the list.
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lPush(key, values);
  }
}
