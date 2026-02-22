const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

require('./db');
const { contentRouter } = require('./routes/content');
const { userDataRouter } = require('./routes/userdata');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients and same-origin server calls.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

app.use('/api', contentRouter);
app.use('/api', userDataRouter);

const shouldServeStatic = process.env.SERVE_STATIC !== 'false';
if (shouldServeStatic) {
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  app.get('/topic', (req, res) => {
    res.sendFile(path.join(publicDir, 'topic.html'));
  });

  app.get('/modules/system-design', (req, res) => {
    res.sendFile(path.join(publicDir, 'modules', 'system-design.html'));
  });

  app.get('/modules/lld', (req, res) => {
    res.sendFile(path.join(publicDir, 'modules', 'lld.html'));
  });
}

app.use((error, req, res, next) => {
  if (error && error.message === 'CORS origin not allowed.') {
    return res.status(403).json({ error: 'CORS origin not allowed.' });
  }
  return next(error);
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error.' });
});

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT, 10) || 3000;
  app.listen(port, () => {
    console.log(`Activity Guide server listening on http://localhost:${port}`);
  });
}

module.exports = app;
