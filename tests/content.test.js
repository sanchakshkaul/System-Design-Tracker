const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const classIndexPath = path.join(root, 'public', 'assets', 'data', 'class-index.json');
const topicsDir = path.join(root, 'public', 'assets', 'data', 'topics');
const seedPath = path.join(root, 'server', 'seed', 'content.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('class-index.json has 24 classes', () => {
  const classIndex = readJson(classIndexPath);
  assert.equal(classIndex.length, 24);
  assert.equal(classIndex[0].id, 1);
  assert.equal(classIndex[23].id, 24);
});

test('24 topic files exist and follow required schema', () => {
  const files = fs
    .readdirSync(topicsDir)
    .filter((file) => /^class-\d+\.json$/.test(file))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

  assert.equal(files.length, 24);

  for (const file of files) {
    const topic = readJson(path.join(topicsDir, file));
    assert.equal(typeof topic.id, 'number');
    assert.ok(topic.id >= 1 && topic.id <= 24);
    assert.ok(['sys', 'lld'].includes(topic.module));
    assert.equal(typeof topic.slug, 'string');
    assert.equal(Array.isArray(topic.topics), true);
    assert.equal(typeof topic.estimatedReadMinutes, 'number');

    assert.equal(Array.isArray(topic.sections.concepts), true);
    assert.equal(typeof topic.sections.architecture, 'object');
    assert.equal(Array.isArray(topic.sections.tradeoffs), true);
    assert.equal(Array.isArray(topic.sections.examples), true);
    assert.equal(Array.isArray(topic.sections.interviewQa), true);
    assert.equal(typeof topic.sections.revision, 'object');

    assert.ok(topic.sections.concepts.length >= 2);
    assert.ok(topic.sections.tradeoffs.length >= 3);
    assert.ok(topic.sections.examples.length >= 2);
    assert.ok(topic.sections.interviewQa.length >= 5);
    assert.ok(topic.sections.revision.cheatSheet.length >= 6);
  }
});

test('seed/content.json mirrors class and topic counts', () => {
  const seed = readJson(seedPath);
  assert.equal(seed.classIndex.length, 24);
  assert.equal(seed.classes.length, 24);
});
