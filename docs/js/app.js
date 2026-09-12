'use strict';

(function () {
  const screens = {
    gallery: document.getElementById('screen-gallery'),
    levels: document.getElementById('screen-levels'),
    game: document.getElementById('screen-game'),
  };
  const galleryEl = document.getElementById('gallery');
  const levelsEl = document.getElementById('levels');
  const previewEl = document.getElementById('levels-preview');
  const statusEl = document.getElementById('status');

  let currentImage = null;
  let currentGrids = [];

  /* -------------------------------- экраны -------------------------------- */

  function showScreen(name) {
    Object.keys(screens).forEach((key) => {
      screens[key].classList.toggle('is-active', key === name);
    });
    document.body.dataset.screen = name;
    window.scrollTo(0, 0);
    if (name === 'game') requestAnimationFrame(() => Game.fit());
  }

  function goToGallery() {
    Game.stop();
    currentImage = null;
    currentGrids = [];
    hideStatus();
    showScreen('gallery');
  }

  /* -------------------------------- галерея ------------------------------- */

  function renderGallery() {
    galleryEl.textContent = '';
    IMAGES.forEach((image) => {
      const item = document.createElement('li');
      item.className = 'gallery__item';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb';
      button.title = image.title[getLang()];
      button.addEventListener('click', () => openLevels(image));

      const img = document.createElement('img');
      img.className = 'thumb__img';
      img.src = image.url;
      img.alt = image.title[getLang()];
      img.loading = 'lazy';

      const caption = document.createElement('span');
      caption.className = 'thumb__caption';
      caption.textContent = image.title[getLang()];

      button.append(img, caption);
      item.appendChild(button);
      galleryEl.appendChild(item);
    });
  }

  /* ---------------------------- выбор сложности --------------------------- */

  function openLevels(image) {
    currentImage = image;
    currentGrids = [];
    renderPreview();
    levelsEl.textContent = '';
    showScreen('levels');
    showStatus(t('loading'), false);

    loadImageSize(image)
      .then((size) => {
        if (currentImage !== image) return;
        hideStatus();
        currentGrids = computeAllGrids(size.width, size.height);
        renderLevels();
      })
      .catch(() => {
        if (currentImage !== image) return;
        showStatus(t('loadError'), true);
      });
  }

  function renderPreview() {
    previewEl.textContent = '';
    if (!currentImage) return;
    const img = document.createElement('img');
    img.className = 'preview__img';
    img.src = currentImage.url;
    img.alt = currentImage.title[getLang()];
    const caption = document.createElement('p');
    caption.className = 'preview__title';
    caption.textContent = currentImage.title[getLang()];
    previewEl.append(img, caption);
  }

  function renderLevels() {
    levelsEl.textContent = '';
    currentGrids.forEach((grid) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'level';
      button.addEventListener('click', () => startGame(grid));

      const parts = document.createElement('span');
      parts.className = 'level__parts';
      parts.textContent = String(grid.parts);

      const shape = document.createElement('span');
      shape.className = 'level__shape';
      shape.textContent = grid.cols + ' × ' + grid.rows;

      const count = document.createElement('span');
      count.className = 'level__count';
      count.textContent = grid.count + ' ' + t('tiles');

      button.append(parts, shape, count);
      item.appendChild(button);
      levelsEl.appendChild(item);
    });
  }

  /* ---------------------------------- игра -------------------------------- */

  function startGame(grid) {
    showScreen('game');
    Game.start(currentImage, grid);
  }

  /* -------------------------------- статус -------------------------------- */

  function showStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.add('is-visible');
    statusEl.classList.toggle('is-error', Boolean(isError));
  }

  function hideStatus() {
    statusEl.classList.remove('is-visible', 'is-error');
    statusEl.textContent = '';
  }

  /* -------------------------------- запуск -------------------------------- */

  function onLangChange() {
    renderGallery();
    renderPreview();
    if (currentGrids.length) renderLevels();
    Game.refresh();
  }

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang, onLangChange));
  });
  document.getElementById('levels-exit').addEventListener('click', goToGallery);
  document.getElementById('game-exit').addEventListener('click', goToGallery);
  document.getElementById('new-game').addEventListener('click', goToGallery);

  setLang(getLang());
  renderGallery();
  showScreen('gallery');
})();
