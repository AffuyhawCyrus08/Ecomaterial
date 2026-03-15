require('dotenv').config();
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// Session store configuration
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecomaterial_db',
  clearExpired: true,
  checkExpirationInterval: 900000, // Check every 15 minutes
  expiration: 86400000 // 24 hours
});

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'super-secret-key',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 86400000, // 24 hours
    sameSite: 'lax'
  }
};

module.exports = {
  session: session(sessionConfig),
  sessionStore
};
