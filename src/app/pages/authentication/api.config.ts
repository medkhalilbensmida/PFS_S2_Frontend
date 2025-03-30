export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER_ADMIN: '/auth/signup/admin',
    REGISTER_ENSEIGNANT: '/auth/signup/enseignant',
    REFRESH_TOKEN: '/auth/refresh-token'
  },
  SESSIONS: '/sessions'
};

export const APP_CONST = {
  tokenLocalStorageKey: 'auth_token',
  userRoleLocalStorageKey: 'user_role',
  userDataLocalStorageKey: 'user_data',
  refreshTokenLocalStorageKey: 'refresh_token',
  tokenExpirationKey: 'token_expiration'
};