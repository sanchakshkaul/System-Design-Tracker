(function () {
  function trimTrailingSlash(value) {
    return String(value || '').replace(/\/+$/, '');
  }

  function getApiBaseUrl() {
    const runtimeConfigBase =
      window.RUNTIME_CONFIG && typeof window.RUNTIME_CONFIG.API_BASE_URL === 'string'
        ? window.RUNTIME_CONFIG.API_BASE_URL
        : '';
    const metaBase = document.querySelector('meta[name="api-base-url"]')?.content || '';
    return trimTrailingSlash(runtimeConfigBase || metaBase);
  }

  const API_BASE_URL = getApiBaseUrl();

  function withBase(path) {
    if (!API_BASE_URL) {
      return path;
    }
    return `${API_BASE_URL}${path}`;
  }

  async function request(url, options) {
    const response = await fetch(withBase(url), {
      headers: {
        'Content-Type': 'application/json'
      },
      ...options
    });

    if (response.status === 204) {
      return null;
    }

    const payload = await response.json();
    if (!response.ok) {
      const message = payload && payload.error ? payload.error : `Request failed with status ${response.status}`;
      throw new Error(message);
    }
    return payload;
  }

  async function getClasses() {
    try {
      const data = await request('/api/classes');
      return data.classes;
    } catch (error) {
      const fallback = await fetch('/assets/data/class-index.json');
      return fallback.json();
    }
  }

  async function getClassById(classId) {
    try {
      const data = await request(`/api/classes/${classId}`);
      return data.class;
    } catch (error) {
      const fallback = await fetch(`/assets/data/topics/class-${classId}.json`);
      if (!fallback.ok) {
        throw error;
      }
      return fallback.json();
    }
  }

  async function getProgress() {
    return request('/api/progress');
  }

  async function setProgress(classId, status) {
    return request(`/api/progress/${classId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async function getNotes(classId) {
    const data = await request(`/api/notes/${classId}`);
    return data.notes;
  }

  async function createNote(classId, sectionKey, note) {
    const data = await request('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ classId, sectionKey, note })
    });
    return data.note;
  }

  async function updateNote(noteId, note) {
    return request(`/api/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ note })
    });
  }

  async function deleteNote(noteId) {
    return request(`/api/notes/${noteId}`, {
      method: 'DELETE'
    });
  }

  async function getBookmarks() {
    const data = await request('/api/bookmarks');
    return data.bookmarks;
  }

  async function createBookmark(classId, sectionKey, anchorId, label) {
    const data = await request('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ classId, sectionKey, anchorId, label })
    });
    return data.bookmark;
  }

  async function deleteBookmark(bookmarkId) {
    return request(`/api/bookmarks/${bookmarkId}`, {
      method: 'DELETE'
    });
  }

  window.api = {
    getClasses,
    getClassById,
    getProgress,
    setProgress,
    getNotes,
    createNote,
    updateNote,
    deleteNote,
    getBookmarks,
    createBookmark,
    deleteBookmark
  };
})();
