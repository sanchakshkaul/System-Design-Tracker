const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

require('./db');
const { contentRouter } = require('./routes/content');
const { userDataRouter } = require('./routes/userdata');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use('/api', contentRouter);
app.use('/api', userDataRouter);

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

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT, 10) || 3000;
  app.listen(port, () => {
    console.log(`Activity Guide server listening on http://localhost:${port}`);
  });
}

module.exports = app;
