(function () {
  const typeConfig = {
    intro: { label: 'Intro', cls: 'badge-intro' },
    practice: { label: 'Practice', cls: 'badge-practice' },
    spark: { label: 'Spark', cls: 'badge-spark' },
    assess: { label: 'Assess', cls: 'badge-assess' }
  };

  const state = {
    classes: [],
    progressMap: {},
    activeFilter: 'all',
    moduleFilter: document.body.dataset.moduleFilter || 'all'
  };

  function applyHeaderContent() {
    document.getElementById('header-tag').textContent = document.body.dataset.pageTag || '// Study Hub';
    document.getElementById('page-title').textContent = document.body.dataset.pageTitle || 'System Design & LLD Curriculum';
    document.getElementById('page-description').textContent =
      document.body.dataset.pageDescription || 'Design-focused curriculum with examples and interview prep.';

    if (state.moduleFilter !== 'all') {
      document.querySelectorAll('.module-filter').forEach((node) => {
        node.style.display = 'none';
      });
    }
  }

  function renderStats(classes) {
    const activityCount = classes.reduce((total, item) => total + item.activities.length, 0);
    const moduleCount = new Set(classes.map((item) => item.module)).size;
    const statBar = document.getElementById('stats-bar');

    statBar.innerHTML = [
      ['Classes', classes.length],
      ['Activities', `${activityCount}+`],
      ['Activity Types', 4],
      ['Modules', moduleCount]
    ]
      .map(
        ([label, value]) =>
          `<div class="stat"><div class="stat-num">${value}</div><div class="stat-label">${label}</div></div>`
      )
      .join('');
  }

  function renderProgressSummary() {
    const done = window.ProgressUtils.countCompleted(state.classes, state.progressMap);
    const total = state.classes.length;
    document.getElementById('done-count').textContent = `${done} / ${total}`;
    document.getElementById('progress-fill').style.width = total > 0 ? `${(done / total) * 100}%` : '0%';
  }

  async function updateClassStatus(classId, status) {
    try {
      await window.api.setProgress(classId, status);
      state.progressMap[classId] = status;
      const checkEl = document.querySelector(`.class-check[data-class-id='${classId}']`);
      if (checkEl) {
        window.ProgressUtils.applyCheckVisual(checkEl, status);
      }
      renderProgressSummary();
    } catch (error) {
      window.alert(error.message);
    }
  }

  function renderCheckGrid() {
    const grid = document.getElementById('check-grid');
    grid.innerHTML = '';

    state.classes.forEach((item) => {
      const status = state.progressMap[item.id] || 'not_started';
      const el = document.createElement('div');
      el.className = 'class-check';
      el.dataset.classId = item.id;
      el.innerHTML = `<span class="checkmark">○</span><span>Class ${item.id}</span>`;
      window.ProgressUtils.applyCheckVisual(el, status);

      el.addEventListener('click', async () => {
        const current = state.progressMap[item.id] || 'not_started';
        const next = current === 'completed' ? 'not_started' : 'completed';
        await updateClassStatus(item.id, next);
      });
      grid.appendChild(el);
    });
  }

  function buildCard(item) {
    const card = document.createElement('div');
    card.className = 'class-card';
    card.dataset.module = item.module;
    card.dataset.types = [...new Set(item.activities.map((activity) => activity.type))].join(' ');
    card.dataset.search = `${item.id} ${item.title} ${item.topics.join(' ')} ${item.activities
      .map((activity) => `${activity.title} ${activity.desc}`)
      .join(' ')}`.toLowerCase();

    const activitiesHtml = item.activities
      .map((activity) => {
        const type = typeConfig[activity.type];
        return `
          <div class="activity-item">
            <div class="act-header"><span class="badge ${type.cls}">${type.label}</span></div>
            <div class="act-item-title">${activity.title}</div>
            <div class="act-item-desc">${activity.desc}</div>
            <div class="act-meta">
              <span class="meta-chip">${activity.time}</span>
              <span class="meta-chip">${activity.format}</span>
            </div>
          </div>`;
      })
      .join('');

    card.innerHTML = `
      <div class="card-header">
        <div class="class-num">C${item.id}</div>
        <div class="card-title-wrap">
          <div class="card-title">${item.title}</div>
          <div class="card-subtitle">${item.topics.slice(0, 3).join(' | ')}</div>
        </div>
        <div class="card-arrow">▶</div>
      </div>
      <div class="card-body">
        <div class="activity-section">${activitiesHtml}</div>
        <div class="card-links"><a class="study-link" href="/topic?id=${item.id}">Open Topic Page</a></div>
      </div>`;

    card.querySelector('.card-header').addEventListener('click', () => {
      card.classList.toggle('expanded');
    });

    return card;
  }

  function renderCards() {
    const classesGrid = document.getElementById('classes-grid');
    classesGrid.innerHTML = '';
    state.classes.forEach((item) => classesGrid.appendChild(buildCard(item)));
  }

  function applyFilters() {
    const query = document.getElementById('search').value.trim().toLowerCase();
    const cards = Array.from(document.querySelectorAll('.class-card'));
    const visible = window.SearchUtils.applyCardFilter(cards, state.activeFilter, query, state.moduleFilter);
    document.getElementById('empty-state').style.display = visible === 0 ? 'block' : 'none';
  }

  function bindFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach((node) => node.classList.remove('active'));
        btn.classList.add('active');
        state.activeFilter = btn.dataset.filter;
        applyFilters();
      });
    });

    document.getElementById('search').addEventListener('input', applyFilters);
  }

  async function loadData() {
    state.classes = await window.api.getClasses();
    if (state.moduleFilter !== 'all') {
      state.classes = state.classes.filter((item) => item.module === state.moduleFilter);
    }

    try {
      const progressData = await window.api.getProgress();
      state.progressMap = progressData.map || {};
    } catch (error) {
      state.progressMap = {};
    }

    for (let i = 1; i <= 24; i += 1) {
      if (!state.progressMap[i]) {
        state.progressMap[i] = 'not_started';
      }
    }
  }

  async function init() {
    applyHeaderContent();
    await loadData();
    renderStats(state.classes);
    renderCheckGrid();
    renderCards();
    renderProgressSummary();
    bindFilterButtons();
    applyFilters();
  }

  init().catch((error) => {
    document.getElementById('empty-state').style.display = 'block';
    document.getElementById('empty-state').textContent = `Unable to load content: ${error.message}`;
  });
})();
