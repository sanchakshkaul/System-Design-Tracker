CREATE TABLE IF NOT EXISTS progress (
  class_id INTEGER PRIMARY KEY,
  status TEXT NOT NULL CHECK(status IN ('not_started', 'in_progress', 'completed')),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  section_key TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  section_key TEXT NOT NULL,
  anchor_id TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(class_id, section_key, anchor_id)
);
