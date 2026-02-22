const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');

const testDb = path.join(os.tmpdir(), `activity-guide-test-${Date.now()}.db`);
process.env.DB_FILE = testDb;

const app = require('../server/app');
const { db } = require('../server/db');

let createdNoteId = null;
let createdBookmarkId = null;

test.after(() => {
  db.close();
  if (fs.existsSync(testDb)) {
    fs.rmSync(testDb, { force: true });
  }
});

test('DB initialization creates required tables', () => {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('progress', 'notes', 'bookmarks')")
    .all()
    .map((row) => row.name)
    .sort();

  assert.deepEqual(tables, ['bookmarks', 'notes', 'progress']);
});

test('GET /api/classes returns 24 items', async () => {
  const res = await request(app).get('/api/classes').expect(200);
  assert.equal(Array.isArray(res.body.classes), true);
  assert.equal(res.body.classes.length, 24);
});

test('GET /api/classes/:id returns full payload', async () => {
  const res = await request(app).get('/api/classes/1').expect(200);
  assert.equal(res.body.class.id, 1);
  assert.equal(typeof res.body.class.sections, 'object');
  assert.equal(Array.isArray(res.body.class.sections.interviewQa), true);
});

test('GET /api/classes/:id validates class id', async () => {
  await request(app).get('/api/classes/0').expect(400);
});

test('PUT /api/progress persists and round-trips', async () => {
  await request(app).put('/api/progress/3').send({ status: 'completed' }).expect(200);
  const progress = await request(app).get('/api/progress').expect(200);
  assert.equal(progress.body.map['3'], 'completed');
});

test('Notes create, update, delete and max length validation', async () => {
  const createRes = await request(app)
    .post('/api/notes')
    .send({ classId: 2, sectionKey: 'concepts', note: 'Initial note' })
    .expect(201);

  createdNoteId = createRes.body.note.id;
  await request(app).put(`/api/notes/${createdNoteId}`).send({ note: 'Updated note' }).expect(200);

  const longNote = 'x'.repeat(4001);
  await request(app)
    .post('/api/notes')
    .send({ classId: 2, sectionKey: 'concepts', note: longNote })
    .expect(400);

  await request(app).delete(`/api/notes/${createdNoteId}`).expect(204);
  await request(app).delete(`/api/notes/${createdNoteId}`).expect(404);
});

test('Duplicate bookmark returns conflict', async () => {
  const first = await request(app)
    .post('/api/bookmarks')
    .send({ classId: 4, sectionKey: 'tradeoffs', anchorId: 'tradeoffs', label: 'Class 4 - tradeoffs' })
    .expect(201);

  createdBookmarkId = first.body.bookmark.id;

  await request(app)
    .post('/api/bookmarks')
    .send({ classId: 4, sectionKey: 'tradeoffs', anchorId: 'tradeoffs', label: 'Class 4 - tradeoffs' })
    .expect(409);

  await request(app).delete(`/api/bookmarks/${createdBookmarkId}`).expect(204);
});
