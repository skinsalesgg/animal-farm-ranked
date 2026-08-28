type CorsOriginResolver = (origin: string, c: { req: { header: (name: string) => string | undefined } }) => string | null | undefined;

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createCorsOriginResolver(): CorsOriginResolver {
  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGINS);

  if (allowedOrigins.length === 0) {
    return (origin) => origin ?? "*";
  }

  return (origin) => {
    if (!origin) {
      return null;
    }

    return allowedOrigins.includes(origin) ? origin : null;
  };
}
