// server/config/jwt.ts
export const JWT_CONFIG = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-change-in-production',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '1d', // 1 day
  issuer: 'zuzu-auth',
  audience: 'zuzu-app'
};

export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  path: '/'
};
