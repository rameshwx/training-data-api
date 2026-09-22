export function getConfig(env = process.env) {
  const config = {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: Number(env.PORT ?? 8080),
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, ''),
    apiKey: env.API_KEY ?? '',
    pg: {
      connectionString: env.DATABASE_URL,
      host: env.PGHOST ?? 'localhost',
      port: Number(env.PGPORT ?? 5432),
      database: env.PGDATABASE ?? 'training_data',
      user: env.PGUSER ?? 'training_data',
      password: env.PGPASSWORD,
    },
  };

  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }
  if (config.nodeEnv === 'production' && config.apiKey.length < 20) {
    throw new Error('API_KEY must contain at least 20 characters in production.');
  }
  if (!config.pg.connectionString && !config.pg.password) {
    throw new Error('PGPASSWORD or DATABASE_URL is required.');
  }

  return config;
}
