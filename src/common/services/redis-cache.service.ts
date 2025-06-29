import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { EnvConfiguration } from '../../config/app.config';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(EnvConfiguration().cache_url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  /**
   * Obtiene un valor desde Redis cache
   * @param key - La clave del cache
   * @returns El valor parseado o null si no existe o expiró
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Almacena un valor en Redis cache
   * @param key - La clave del cache
   * @param value - El valor a almacenar
   * @param ttlSeconds - Tiempo de vida en segundos (opcional)
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Elimina una clave del cache
   * @param key - La clave a eliminar
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Verifica si una clave existe en el cache
   * @param key - La clave a verificar
   * @returns true si existe, false si no
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Limpia todo el cache (usar con cuidado)
   */
  async flush(): Promise<void> {
    try {
      await this.redis.flushall();
      this.logger.log('Cache flushed successfully');
    } catch (error) {
      this.logger.error('Error flushing cache:', error);
    }
  }

  /**
   * Cierra la conexión Redis (para cleanup)
   */
  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  /**
   * Obtiene datos desde cache o los obtiene usando la función proporcionada si no existen
   * @param key - La clave del cache
   * @param fetchFunction - Función para obtener los datos si no están en cache
   * @param ttlSeconds - Tiempo de vida del cache en segundos (default: 10 minutos)
   * @returns Los datos desde cache o recién obtenidos
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 600, // 10 minutos por defecto
  ): Promise<T | null> {
    try {
      // Intentar obtener desde cache
      const cached = await this.get<T>(key);
      if (cached) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return cached;
      }

      this.logger.debug(`Cache miss for key: ${key}, fetching fresh data`);

      // Si no está en cache, obtener usando la función proporcionada
      const freshData = await fetchFunction();

      // Guardar en cache
      await this.set(key, freshData, ttlSeconds);

      return freshData;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}:`, error);
      // En caso de error, intentar obtener datos frescos sin cache
      try {
        return await fetchFunction();
      } catch (fetchError) {
        this.logger.error(
          `Error fetching fresh data for key ${key}:`,
          fetchError,
        );
        return null;
      }
    }
  }
}
