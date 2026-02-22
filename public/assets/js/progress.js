(function () {
  function isCompleted(status) {
    return status === 'completed';
  }

  function countCompleted(classes, progressMap) {
    return classes.reduce((acc, item) => acc + (isCompleted(progressMap[item.id]) ? 1 : 0), 0);
  }

  function statusLabel(status) {
    if (status === 'completed') {
      return 'completed';
    }
    if (status === 'in_progress') {
      return 'in progress';
    }
    return 'not started';
  }

  function applyCheckVisual(el, status) {
    const checkmark = el.querySelector('.checkmark');
    if (!checkmark) {
      return;
    }

    if (isCompleted(status)) {
      el.classList.add('done');
      checkmark.textContent = '✓';
    } else {
      el.classList.remove('done');
      checkmark.textContent = status === 'in_progress' ? '•' : '○';
    }
  }

  window.ProgressUtils = {
    isCompleted,
    countCompleted,
    statusLabel,
    applyCheckVisual
  };
})();
