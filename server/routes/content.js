const fs = require('fs');
const path = require('path');
const express = require('express');

const router = express.Router();

const contentPath = path.join(__dirname, '..', 'seed', 'content.json');
let payload = { classIndex: [], classes: [] };

function loadContent() {
  const raw = fs.readFileSync(contentPath, 'utf-8');
  payload = JSON.parse(raw);
}

loadContent();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.get('/classes', (req, res) => {
  res.json({ classes: payload.classIndex });
});

router.get('/classes/:id', (req, res) => {
  const classId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(classId) || classId < 1 || classId > 24) {
    return res.status(400).json({ error: 'classId must be an integer between 1 and 24.' });
  }

  const topic = payload.classes.find((item) => item.id === classId);
  if (!topic) {
    return res.status(404).json({ error: 'Class not found.' });
  }

  return res.json({ class: topic });
});

module.exports = {
  contentRouter: router,
  getContentPayload: () => payload,
  reloadContent: loadContent
};
