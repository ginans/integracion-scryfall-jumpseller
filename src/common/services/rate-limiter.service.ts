import Bottleneck from 'bottleneck';

// RateLimiterService centralizado para todas las requests a Jumpseller
// Límites de Jumpseller: 20 requests/segundo o 800 requests/minuto
export class RateLimiterService {
  private static limiter: Bottleneck;
  static getLimiter(): Bottleneck {
    if (!RateLimiterService.limiter) {
      RateLimiterService.limiter = new Bottleneck({
        maxConcurrent: 15, // máximo 15 requests simultáneas para estar seguros
        minTime: 55, // mínimo 55ms entre cada request (18 por segundo para estar bajo el límite)
        reservoir: 800, // máximo 800 requests
        reservoirRefreshAmount: 800, // recarga 800 requests
        reservoirRefreshInterval: 60 * 1000, // cada 60 segundos (1 minuto)
      });
    }
    return RateLimiterService.limiter;
  }
  // Método para envolver cualquier función async con el rate limiter
  static async schedule<T>(fn: () => Promise<T>): Promise<T> {
    const limiter = RateLimiterService.getLimiter();
    console.log(
      `Rate Limiter - Jobs en cola: ${limiter.queued()}, Ejecutándose: ${limiter.running()}`,
    );
    return limiter.schedule(fn);
  }
}
