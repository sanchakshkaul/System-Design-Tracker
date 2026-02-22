const express = require('express');
const { db, nowIso } = require('../db');

const router = express.Router();

const allowedStatus = new Set(['not_started', 'in_progress', 'completed']);

function parseClassId(input) {
  const classId = Number.parseInt(input, 10);
  if (!Number.isInteger(classId) || classId < 1 || classId > 24) {
    return null;
  }
  return classId;
}

router.get('/progress', (req, res) => {
  const rows = db.prepare('SELECT class_id, status, updated_at FROM progress ORDER BY class_id').all();
  const map = {};
  for (let i = 1; i <= 24; i += 1) {
    map[i] = 'not_started';
  }
  for (const row of rows) {
    map[row.class_id] = row.status;
  }
  res.json({ progress: rows, map });
});

router.put('/progress/:classId', (req, res) => {
  const classId = parseClassId(req.params.classId);
  if (!classId) {
    return res.status(400).json({ error: 'classId must be an integer between 1 and 24.' });
  }

  const status = req.body && req.body.status;
  if (!allowedStatus.has(status)) {
    return res.status(400).json({ error: 'status must be one of not_started|in_progress|completed.' });
  }

  const timestamp = nowIso();
  db.prepare(
    `INSERT INTO progress (class_id, status, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(class_id)
     DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`
  ).run(classId, status, timestamp);

  return res.json({ classId, status, updatedAt: timestamp });
});

router.get('/notes/:classId', (req, res) => {
  const classId = parseClassId(req.params.classId);
  if (!classId) {
    return res.status(400).json({ error: 'classId must be an integer between 1 and 24.' });
  }

  const notes = db.prepare(
    'SELECT id, class_id AS classId, section_key AS sectionKey, note, created_at AS createdAt, updated_at AS updatedAt FROM notes WHERE class_id = ? ORDER BY updated_at DESC'
  ).all(classId);

  return res.json({ notes });
});

router.post('/notes', (req, res) => {
  const classId = parseClassId(req.body && req.body.classId);
  const sectionKey = (req.body && req.body.sectionKey ? String(req.body.sectionKey) : '').trim();
  const note = (req.body && req.body.note ? String(req.body.note) : '').trim();

  if (!classId) {
    return res.status(400).json({ error: 'classId must be an integer between 1 and 24.' });
  }
  if (!sectionKey) {
    return res.status(400).json({ error: 'sectionKey is required.' });
  }
  if (!note) {
    return res.status(400).json({ error: 'note is required.' });
  }
  if (note.length > 4000) {
    return res.status(400).json({ error: 'note exceeds 4000 characters.' });
  }

  const timestamp = nowIso();
  const info = db.prepare(
    'INSERT INTO notes (class_id, section_key, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(classId, sectionKey, note, timestamp, timestamp);

  return res.status(201).json({
    note: {
      id: info.lastInsertRowid,
      classId,
      sectionKey,
      note,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  });
});

router.put('/notes/:noteId', (req, res) => {
  const noteId = Number.parseInt(req.params.noteId, 10);
  const note = (req.body && req.body.note ? String(req.body.note) : '').trim();

  if (!Number.isInteger(noteId) || noteId < 1) {
    return res.status(400).json({ error: 'noteId must be a positive integer.' });
  }
  if (!note) {
    return res.status(400).json({ error: 'note is required.' });
  }
  if (note.length > 4000) {
    return res.status(400).json({ error: 'note exceeds 4000 characters.' });
  }

  const timestamp = nowIso();
  const info = db.prepare('UPDATE notes SET note = ?, updated_at = ? WHERE id = ?').run(note, timestamp, noteId);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Note not found.' });
  }

  return res.json({ noteId, note, updatedAt: timestamp });
});

router.delete('/notes/:noteId', (req, res) => {
  const noteId = Number.parseInt(req.params.noteId, 10);
  if (!Number.isInteger(noteId) || noteId < 1) {
    return res.status(400).json({ error: 'noteId must be a positive integer.' });
  }

  const info = db.prepare('DELETE FROM notes WHERE id = ?').run(noteId);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Note not found.' });
  }

  return res.status(204).send();
});

router.get('/bookmarks', (req, res) => {
  const bookmarks = db.prepare(
    'SELECT id, class_id AS classId, section_key AS sectionKey, anchor_id AS anchorId, label, created_at AS createdAt FROM bookmarks ORDER BY created_at DESC'
  ).all();

  return res.json({ bookmarks });
});

router.post('/bookmarks', (req, res) => {
  const classId = parseClassId(req.body && req.body.classId);
  const sectionKey = (req.body && req.body.sectionKey ? String(req.body.sectionKey) : '').trim();
  const anchorId = (req.body && req.body.anchorId ? String(req.body.anchorId) : '').trim();
  const label = (req.body && req.body.label ? String(req.body.label) : '').trim();

  if (!classId) {
    return res.status(400).json({ error: 'classId must be an integer between 1 and 24.' });
  }
  if (!sectionKey || !anchorId || !label) {
    return res.status(400).json({ error: 'sectionKey, anchorId, and label are required.' });
  }

  const timestamp = nowIso();
  try {
    const info = db.prepare(
      'INSERT INTO bookmarks (class_id, section_key, anchor_id, label, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(classId, sectionKey, anchorId, label, timestamp);

    return res.status(201).json({
      bookmark: {
        id: info.lastInsertRowid,
        classId,
        sectionKey,
        anchorId,
        label,
        createdAt: timestamp
      }
    });
  } catch (error) {
    if (String(error.code).includes('SQLITE_CONSTRAINT')) {
      return res.status(409).json({ error: 'Bookmark already exists for this section.' });
    }
    throw error;
  }
});

router.delete('/bookmarks/:bookmarkId', (req, res) => {
  const bookmarkId = Number.parseInt(req.params.bookmarkId, 10);
  if (!Number.isInteger(bookmarkId) || bookmarkId < 1) {
    return res.status(400).json({ error: 'bookmarkId must be a positive integer.' });
  }

  const info = db.prepare('DELETE FROM bookmarks WHERE id = ?').run(bookmarkId);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Bookmark not found.' });
  }

  return res.status(204).send();
});

module.exports = {
  userDataRouter: router
};
