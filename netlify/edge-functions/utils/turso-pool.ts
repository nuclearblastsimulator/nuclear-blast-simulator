import { createClient } from "npm:@libsql/client/web";

/**
 * Connection pool configuration for Turso database
 * Optimized for high-concurrency scenarios
 */

// Connection pool settings
const POOL_CONFIG = {
  // Maximum concurrent connections (Turso free tier supports up to 100)
  maxConnections: 20,

  // Minimum idle connections to maintain
  minConnections: 2,

  // Connection timeout in milliseconds
  connectionTimeout: 5000,

  // Idle timeout before closing unused connections
  idleTimeout: 30000,

  // Maximum queue size for pending requests
  maxQueueSize: 100,

  // Retry configuration
  retryAttempts: 3,
  retryDelay: 100, // ms
};

// Connection pool implementation
class TursoConnectionPool {
  private connections: Array<{
    client: ReturnType<typeof createClient>;
    inUse: boolean;
    lastUsed: number;
  }> = [];

  private waitQueue: Array<{
    resolve: (client: ReturnType<typeof createClient>) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];

  private cleanupInterval: number | null = null;

  constructor() {
    // Initialize minimum connections
    this.initializePool();

    // Start cleanup interval
    this.startCleanup();
  }

  private initializePool() {
    for (let i = 0; i < POOL_CONFIG.minConnections; i++) {
      try {
        const client = this.createConnection();
        this.connections.push({
          client,
          inUse: false,
          lastUsed: Date.now(),
        });
      } catch (error) {
        console.error("Failed to initialize connection:", error);
      }
    }
  }

  private createConnection() {
    return createClient({
      url: Deno.env.get("TURSO_DATABASE_URL") || "",
      authToken: Deno.env.get("TURSO_AUTH_TOKEN") || "",
    });
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      // Remove idle connections beyond minimum
      this.connections = this.connections.filter((conn, index) => {
        if (
          index >= POOL_CONFIG.minConnections &&
          !conn.inUse &&
          now - conn.lastUsed > POOL_CONFIG.idleTimeout
        ) {
          try {
            // Turso clients don't have explicit close method
            return false;
          } catch (error) {
            console.error("Error closing connection:", error);
          }
        }
        return true;
      });

      // Timeout waiting requests
      this.waitQueue = this.waitQueue.filter((item) => {
        if (now - item.timestamp > POOL_CONFIG.connectionTimeout) {
          item.reject(new Error("Connection timeout"));
          return false;
        }
        return true;
      });
    }, 5000) as unknown as number;
  }

  getConnection(): Promise<ReturnType<typeof createClient>> {
    // Try to find an available connection
    for (const conn of this.connections) {
      if (!conn.inUse) {
        conn.inUse = true;
        conn.lastUsed = Date.now();
        return Promise.resolve(conn.client);
      }
    }

    // Create new connection if under limit
    if (this.connections.length < POOL_CONFIG.maxConnections) {
      try {
        const client = this.createConnection();
        this.connections.push({
          client,
          inUse: true,
          lastUsed: Date.now(),
        });
        return Promise.resolve(client);
      } catch (error) {
        console.error("Failed to create new connection:", error);
        throw error;
      }
    }

    // Queue the request if at capacity
    if (this.waitQueue.length >= POOL_CONFIG.maxQueueSize) {
      throw new Error("Connection pool queue full");
    }

    return new Promise((resolve, reject) => {
      this.waitQueue.push({
        resolve,
        reject,
        timestamp: Date.now(),
      });
    });
  }

  releaseConnection(client: ReturnType<typeof createClient>) {
    // Mark connection as available
    const conn = this.connections.find((c) => c.client === client);
    if (conn) {
      conn.inUse = false;
      conn.lastUsed = Date.now();

      // Check if any requests are waiting
      if (this.waitQueue.length > 0) {
        const waiter = this.waitQueue.shift();
        if (waiter) {
          conn.inUse = true;
          waiter.resolve(client);
        }
      }
    }
  }

  async executeWithRetry<T>(
    fn: (client: ReturnType<typeof createClient>) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < POOL_CONFIG.retryAttempts; attempt++) {
      const client = await this.getConnection();

      try {
        const result = await fn(client);
        this.releaseConnection(client);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.releaseConnection(client);

        // Don't retry on validation errors
        if (error.message?.includes("validation") ||
            error.message?.includes("Missing required")) {
          throw error;
        }

        // Exponential backoff
        if (attempt < POOL_CONFIG.retryAttempts - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, POOL_CONFIG.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error("Failed after retries");
  }

  destroy() {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
    }

    // Reject all waiting requests
    for (const waiter of this.waitQueue) {
      waiter.reject(new Error("Connection pool destroyed"));
    }

    this.connections = [];
    this.waitQueue = [];
  }
}

// Export singleton instance
let pool: TursoConnectionPool | null = null;

export function getTursoPool(): TursoConnectionPool {
  if (!pool) {
    pool = new TursoConnectionPool();
  }
  return pool;
}

// Helper function for executing queries with the pool
export function executePooled<T>(
  fn: (client: ReturnType<typeof createClient>) => Promise<T>
): Promise<T> {
  const pool = getTursoPool();
  return pool.executeWithRetry(fn);
}