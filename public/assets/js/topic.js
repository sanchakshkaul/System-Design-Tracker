(function () {
  const sectionIds = ['concepts', 'architecture', 'tradeoffs', 'examples', 'interviewQa', 'revision'];
  const state = {
    classId: null,
    currentClass: null,
    classes: [],
    progressMap: {},
    bookmarks: [],
    notes: []
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function getClassId() {
    const params = new URLSearchParams(window.location.search);
    const classId = Number.parseInt(params.get('id'), 10);
    if (!Number.isInteger(classId) || classId < 1 || classId > 24) {
      return null;
    }
    return classId;
  }

  function renderHeader() {
    const cls = state.currentClass;
    document.title = `${cls.title} | Activity Guide`;
    document.getElementById('topic-tag').textContent = `// Class ${cls.id}`;
    document.getElementById('topic-title').textContent = cls.title;
    document.getElementById('topic-summary').textContent =
      `Interview prep guide for ${cls.title}. Focus topics: ${cls.topics.join(', ')}.`;

    const meta = document.getElementById('topic-meta');
    meta.innerHTML = `
      <span class="meta-chip">Module: ${cls.module === 'sys' ? 'System Design' : 'LLD / OOP'}</span>
      <span class="meta-chip">Read Time: ${cls.estimatedReadMinutes} min</span>
      ${cls.topics.map((topic) => `<span class="meta-chip">${escapeHtml(topic)}</span>`).join('')}
    `;
  }

  function renderConcepts() {
    const content = document.getElementById('concepts-content');
    content.innerHTML = state.currentClass.sections.concepts
      .map(
        (item) => `
        <h3 style="margin-top: 10px; font-size: 0.88rem;">${escapeHtml(item.heading)}</h3>
        <p class="copy">${escapeHtml(item.body)}</p>`
      )
      .join('');
  }

  function renderArchitecture() {
    const architecture = state.currentClass.sections.architecture;
    const content = document.getElementById('architecture-content');
    content.innerHTML = `
      <h3 style="margin-top: 10px; font-size: 0.88rem;">Components</h3>
      <ul class="list">${architecture.components.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <h3 style="margin-top: 12px; font-size: 0.88rem;">Flow</h3>
      <ul class="list">${architecture.flowSteps.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <div class="ascii-block">${escapeHtml(architecture.diagramAscii)}</div>
    `;
  }

  function renderTradeoffs() {
    const tradeoffs = state.currentClass.sections.tradeoffs;
    const content = document.getElementById('tradeoffs-content');
    content.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Decision</th>
              <th>Option A</th>
              <th>Option B</th>
              <th>Choose When</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            ${tradeoffs
              .map(
                (row) => `
              <tr>
                <td>${escapeHtml(row.decision)}</td>
                <td>${escapeHtml(row.optionA)}</td>
                <td>${escapeHtml(row.optionB)}</td>
                <td>${escapeHtml(row.chooseWhen)}</td>
                <td>${escapeHtml(row.risk)}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderExamples() {
    const examples = state.currentClass.sections.examples;
    const content = document.getElementById('examples-content');
    content.innerHTML = examples
      .map(
        (example) => `
        <article class="example-card">
          <div class="example-title">${escapeHtml(example.name)}</div>
          <div class="example-copy"><strong>Context:</strong> ${escapeHtml(example.context)}</div>
          <div class="example-copy"><strong>Design choice:</strong> ${escapeHtml(example.designChoice)}</div>
          <div class="example-copy"><strong>Why:</strong> ${escapeHtml(example.why)}</div>
        </article>`
      )
      .join('');
  }

  function renderQa() {
    const qa = state.currentClass.sections.interviewQa;
    const content = document.getElementById('qa-content');
    content.innerHTML = qa
      .map(
        (item) => `
        <article class="qa-card">
          <div class="qa-title">${escapeHtml(item.question)}</div>
          <div class="qa-copy">Answer framework:</div>
          <ul class="list">${item.answerFramework.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul>
        </article>`
      )
      .join('');
  }

  function renderRevision() {
    const revision = state.currentClass.sections.revision;
    const content = document.getElementById('revision-content');
    content.innerHTML = `
      <h3 style="margin-top: 10px; font-size: 0.88rem;">Cheat Sheet</h3>
      <ul class="list">${revision.cheatSheet.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>
      <h3 style="margin-top: 12px; font-size: 0.88rem;">Red Flags</h3>
      <ul class="list">${revision.redFlags.map((flag) => `<li>${escapeHtml(flag)}</li>`).join('')}</ul>
    `;
  }

  function renderTopicSections() {
    renderConcepts();
    renderArchitecture();
    renderTradeoffs();
    renderExamples();
    renderQa();
    renderRevision();
  }

  function setActiveStatus(status) {
    document.querySelectorAll('.status-btn').forEach((button) => {
      if (button.dataset.status === status) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  async function handleStatusUpdate(status) {
    try {
      await window.api.setProgress(state.classId, status);
      state.progressMap[state.classId] = status;
      setActiveStatus(status);
    } catch (error) {
      window.alert(error.message);
    }
  }

  function bindStatusButtons() {
    document.querySelectorAll('.status-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        await handleStatusUpdate(button.dataset.status);
      });
    });
  }

  function renderTopicNavigation() {
    const index = state.classes.findIndex((item) => item.id === state.classId);
    const prev = index > 0 ? state.classes[index - 1] : null;
    const next = index >= 0 && index < state.classes.length - 1 ? state.classes[index + 1] : null;

    const prevAnchor = document.getElementById('prev-topic');
    const nextAnchor = document.getElementById('next-topic');

    if (prev) {
      prevAnchor.href = `/topic?id=${prev.id}`;
      prevAnchor.textContent = `Previous: C${prev.id}`;
    } else {
      prevAnchor.href = '/';
      prevAnchor.textContent = 'Back to Hub';
    }

    if (next) {
      nextAnchor.href = `/topic?id=${next.id}`;
      nextAnchor.textContent = `Next: C${next.id}`;
    } else {
      nextAnchor.href = '/';
      nextAnchor.textContent = 'Back to Hub';
    }
  }

  function getClassBookmarks() {
    return state.bookmarks.filter((bookmark) => bookmark.classId === state.classId);
  }

  function refreshBookmarkButtons() {
    const keyToBookmark = new Map(getClassBookmarks().map((item) => [`${item.sectionKey}:${item.anchorId}`, item]));

    document.querySelectorAll('.bookmark-btn').forEach((btn) => {
      const key = `${btn.dataset.sectionKey}:${btn.dataset.anchorId}`;
      if (keyToBookmark.has(key)) {
        btn.classList.add('saved');
        btn.textContent = 'Bookmarked';
      } else {
        btn.classList.remove('saved');
        btn.textContent = 'Save';
      }
    });
  }

  function renderBookmarkList() {
    const bookmarks = getClassBookmarks();
    const list = document.getElementById('bookmark-list');
    const empty = document.getElementById('bookmark-empty');

    if (bookmarks.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = bookmarks
      .map(
        (bookmark) => `
        <div class="bookmark-item">
          <a href="#${escapeHtml(bookmark.anchorId)}">${escapeHtml(bookmark.label)}</a>
        </div>`
      )
      .join('');
  }

  async function toggleBookmark(sectionKey, anchorId) {
    const existing = getClassBookmarks().find(
      (bookmark) => bookmark.sectionKey === sectionKey && bookmark.anchorId === anchorId
    );

    try {
      if (existing) {
        await window.api.deleteBookmark(existing.id);
      } else {
        const label = `${state.currentClass.title} - ${sectionKey}`;
        await window.api.createBookmark(state.classId, sectionKey, anchorId, label);
      }
      state.bookmarks = await window.api.getBookmarks();
      refreshBookmarkButtons();
      renderBookmarkList();
    } catch (error) {
      window.alert(error.message);
    }
  }

  function bindBookmarkButtons() {
    document.querySelectorAll('.bookmark-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await toggleBookmark(btn.dataset.sectionKey, btn.dataset.anchorId);
      });
    });
  }

  function renderNotes() {
    const list = document.getElementById('notes-list');
    const empty = document.getElementById('notes-empty');

    if (!state.notes.length) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = state.notes
      .map(
        (note) => `
        <div class="note-item" data-note-id="${note.id}">
          <div class="note-meta">
            <span>${escapeHtml(note.sectionKey)}</span>
            <span>${escapeHtml(new Date(note.updatedAt).toLocaleString())}</span>
          </div>
          <textarea class="note-edit" maxlength="4000">${escapeHtml(note.note)}</textarea>
          <div class="note-actions">
            <button class="btn" data-action="save">Update</button>
            <button class="btn btn-danger" data-action="delete">Delete</button>
          </div>
        </div>`
      )
      .join('');

    list.querySelectorAll('.note-item').forEach((item) => {
      const noteId = Number.parseInt(item.dataset.noteId, 10);
      const editor = item.querySelector('.note-edit');
      const saveBtn = item.querySelector('[data-action="save"]');
      const deleteBtn = item.querySelector('[data-action="delete"]');

      saveBtn.addEventListener('click', async () => {
        const nextNote = editor.value.trim();
        if (!nextNote) {
          window.alert('Note cannot be empty.');
          return;
        }
        try {
          await window.api.updateNote(noteId, nextNote);
          state.notes = await window.api.getNotes(state.classId);
          renderNotes();
        } catch (error) {
          window.alert(error.message);
        }
      });

      deleteBtn.addEventListener('click', async () => {
        try {
          await window.api.deleteNote(noteId);
          state.notes = await window.api.getNotes(state.classId);
          renderNotes();
        } catch (error) {
          window.alert(error.message);
        }
      });
    });
  }

  function bindNoteForm() {
    const form = document.getElementById('note-form');
    const sectionSelect = document.getElementById('note-section');
    const noteInput = document.getElementById('note-input');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const note = noteInput.value.trim();
      if (!note) {
        window.alert('Note cannot be empty.');
        return;
      }

      try {
        await window.api.createNote(state.classId, sectionSelect.value, note);
        noteInput.value = '';
        state.notes = await window.api.getNotes(state.classId);
        renderNotes();
      } catch (error) {
        window.alert(error.message);
      }
    });
  }

  async function loadState() {
    state.classId = getClassId();
    if (!state.classId) {
      throw new Error('Invalid class id.');
    }

    const [topic, classes, progressResponse, bookmarks, notes] = await Promise.all([
      window.api.getClassById(state.classId),
      window.api.getClasses(),
      window.api.getProgress().catch(() => ({ map: {} })),
      window.api.getBookmarks().catch(() => []),
      window.api.getNotes(state.classId).catch(() => [])
    ]);

    state.currentClass = topic;
    state.classes = classes;
    state.progressMap = progressResponse.map || {};
    state.bookmarks = bookmarks;
    state.notes = notes;
  }

  async function init() {
    await loadState();
    renderHeader();
    renderTopicSections();
    bindStatusButtons();
    bindBookmarkButtons();
    bindNoteForm();
    renderTopicNavigation();
    setActiveStatus(state.progressMap[state.classId] || 'not_started');
    refreshBookmarkButtons();
    renderBookmarkList();
    renderNotes();

    sectionIds.forEach((id) => {
      const sectionEl = document.getElementById(id);
      if (sectionEl) {
        sectionEl.scrollMarginTop = '16px';
      }
    });
  }

  init().catch((error) => {
    document.getElementById('topic-title').textContent = 'Unable to load topic';
    document.getElementById('topic-summary').textContent = error.message;
  });
})();
