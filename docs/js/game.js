'use strict';

/**
 * Игровое поле: рендер фрагментов, управление (клик-клик и Pointer Events),
 * счётчик ходов, просмотр оригинала и финальная анимация.
 */
const Game = (function () {
  const boardArea = document.getElementById('board-area');
  const boardEl = document.getElementById('board');
  const originalEl = document.getElementById('board-original');
  const movesEl = document.getElementById('moves');
  const winEl = document.getElementById('win');
  const winMovesEl = document.getElementById('win-moves');
  const originalBtn = document.getElementById('toggle-original');

  const FLASH_MS = 500;

  let image = null;
  let grid = null;
  let tiles = [];       // элементы фрагментов, индекс = правильная позиция
  let order = [];       // order[позиция на поле] = номер фрагмента
  let moves = 0;
  let selected = -1;
  let solved = false;
  let showingOriginal = false;
  let drag = null;
  let winTimer = 0;
  let lastSize = '';

  boardEl.addEventListener('pointerdown', onPointerDown);
  boardEl.addEventListener('contextmenu', (e) => e.preventDefault());
  originalBtn.addEventListener('click', () => toggleOriginal());

  new ResizeObserver(() => fit()).observe(boardArea);
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);

  /** Запускает новую партию по выбранной картинке и сетке. */
  function start(nextImage, nextGrid) {
    stop();
    image = nextImage;
    grid = nextGrid;
    moves = 0;
    selected = -1;
    solved = false;
    showingOriginal = false;
    originalBtn.hidden = false;

    boardEl.style.setProperty('--cols', String(grid.cols));
    boardEl.style.setProperty('--rows', String(grid.rows));

    const cropped = croppedBackground(grid);
    originalEl.style.backgroundImage = 'url("' + image.url + '")';
    originalEl.style.backgroundSize = cropped.size;
    originalEl.style.backgroundPosition = cropped.position;

    tiles = [];
    order = [];
    for (let y = 0; y < grid.rows; y += 1) {
      for (let x = 0; x < grid.cols; x += 1) {
        const index = y * grid.cols + x;
        const bg = tileBackground(grid, x, y);
        const el = document.createElement('div');
        el.className = 'tile';
        el.dataset.piece = String(index);
        el.style.backgroundImage = 'url("' + image.url + '")';
        el.style.backgroundSize = bg.size;
        el.style.backgroundPosition = bg.position;
        el.addEventListener('animationend', () => el.classList.remove('is-swapped'));
        tiles.push(el);
        order.push(index);
      }
    }

    shuffleOrder();
    render();
    renderTexts();
    fit();
  }

  /** Сбрасывает состояние поля (при выходе или новой игре). */
  function stop() {
    cancelDrag();
    clearTimeout(winTimer);
    winTimer = 0;
    tiles.forEach((el) => el.remove());
    tiles = [];
    order = [];
    grid = null;
    image = null;
    solved = false;
    showingOriginal = false;
    lastSize = '';
    boardEl.classList.remove('is-flashing', 'is-assembled', 'show-original');
    boardEl.removeAttribute('style');
    winEl.classList.remove('is-visible');
  }

  /** N случайных парных обменов для пазла из N плиток. */
  function shuffleOrder() {
    const n = order.length;
    for (let i = 0; i < n; i += 1) {
      swapCells(randomIndex(n), randomIndex(n));
    }
    if (isSolved()) {
      swapCells(0, randomIndex(n - 1) + 1);
    }
  }

  function randomIndex(n) {
    return Math.floor(Math.random() * n);
  }

  function swapCells(a, b) {
    if (a === b) return;
    const keep = order[a];
    order[a] = order[b];
    order[b] = keep;
  }

  /** Раскладывает фрагменты в DOM согласно текущему состоянию поля. */
  function render() {
    const fragment = document.createDocumentFragment();
    order.forEach((piece, position) => {
      const el = tiles[piece];
      el.dataset.pos = String(position);
      el.classList.toggle('is-selected', position === selected);
      fragment.appendChild(el);
    });
    boardEl.appendChild(fragment);
  }

  /** Обновляет подписи, зависящие от языка и счётчика. */
  function renderTexts() {
    movesEl.textContent = grid ? t('moves') + ': ' + moves : '';
    originalBtn.textContent = t(showingOriginal ? 'hideOriginal' : 'showOriginal');
    winMovesEl.textContent = t('winMoves', { n: moves });
  }

  /** Вписывает поле в доступную область: без прокрутки и без растягивания. */
  function fit() {
    if (!grid) return;
    const availableWidth = boardArea.clientWidth;
    const availableHeight = boardArea.clientHeight;
    if (!availableWidth || !availableHeight) return;

    const scale = Math.min(
      availableWidth / grid.cropWidth,
      availableHeight / grid.cropHeight,
      1
    );
    const width = Math.floor(grid.cropWidth * scale);
    const height = Math.floor(grid.cropHeight * scale);
    const size = width + 'x' + height;
    if (size === lastSize) return;
    lastSize = size;
    boardEl.style.width = width + 'px';
    boardEl.style.height = height + 'px';
  }

  /* ------------------------------- управление ------------------------------ */

  function onPointerDown(event) {
    if (!grid || solved || showingOriginal) return;
    if (drag) return; // второй палец не должен перехватывать перетаскивание
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const el = event.target.closest('.tile');
    if (!el || !boardEl.contains(el)) return;

    const rect = boardEl.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      el,
      from: Number(el.dataset.pos),
      startX: event.clientX,
      startY: event.clientY,
      rect,
      cellWidth: rect.width / grid.cols,
      cellHeight: rect.height / grid.rows,
      active: false,
      over: -1,
    };
    // Порог перетаскивания — половина размера плитки.
    drag.threshold = Math.min(drag.cellWidth, drag.cellHeight) / 2;

    try {
      el.setPointerCapture(event.pointerId);
    } catch (err) {
      /* захват недоступен — обойдёмся слушателями на документе */
    }
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
  }

  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.active) {
      if (Math.sqrt(dx * dx + dy * dy) < drag.threshold) return;
      drag.active = true;
      drag.el.classList.add('is-dragging');
      clearSelection();
    }

    event.preventDefault();
    drag.el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    highlightDropTarget(positionAt(event.clientX, event.clientY));
  }

  function onPointerUp(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const wasDrag = drag.active;
    const from = drag.from;
    const over = drag.over;
    cancelDrag();

    if (wasDrag) {
      if (over >= 0 && over !== from) applyMove(from, over);
    } else {
      handleTap(from);
    }
  }

  function onPointerCancel(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    cancelDrag();
  }

  function cancelDrag() {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);
    if (!drag) return;
    drag.el.classList.remove('is-dragging');
    drag.el.style.transform = '';
    try {
      drag.el.releasePointerCapture(drag.pointerId);
    } catch (err) {
      /* уже освобождён */
    }
    highlightDropTarget(-1);
    drag = null;
  }

  /** Позиция на поле под точкой экрана или -1, если точка вне поля. */
  function positionAt(clientX, clientY) {
    const { rect, cellWidth, cellHeight } = drag;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return -1;
    }
    const col = clamp(Math.floor((clientX - rect.left) / cellWidth), 0, grid.cols - 1);
    const row = clamp(Math.floor((clientY - rect.top) / cellHeight), 0, grid.rows - 1);
    return row * grid.cols + col;
  }

  function highlightDropTarget(position) {
    if (!drag || drag.over === position) return;
    if (drag.over >= 0) tiles[order[drag.over]].classList.remove('is-target');
    drag.over = position;
    if (position >= 0 && position !== drag.from) {
      tiles[order[position]].classList.add('is-target');
    }
  }

  /** Клик-клик: первый клик выделяет фрагмент, второй — меняет местами. */
  function handleTap(position) {
    if (selected === -1) {
      selected = position;
      tiles[order[position]].classList.add('is-selected');
      return;
    }
    if (selected === position) {
      clearSelection();
      return;
    }
    const from = selected;
    clearSelection();
    applyMove(from, position);
  }

  function clearSelection() {
    if (selected >= 0) tiles[order[selected]].classList.remove('is-selected');
    selected = -1;
  }

  /** Ход: обмен позиций двух плиток. */
  function applyMove(from, to) {
    swapCells(from, to);
    moves += 1;
    tiles[order[from]].classList.add('is-swapped');
    tiles[order[to]].classList.add('is-swapped');
    render();
    renderTexts();
    if (isSolved()) celebrate();
  }

  function isSolved() {
    return order.every((piece, position) => piece === position);
  }

  /* --------------------------------- финал -------------------------------- */

  function celebrate() {
    solved = true;
    clearSelection();
    boardEl.classList.remove('show-original');
    boardEl.classList.add('is-flashing');
    originalBtn.hidden = true;
    winEl.classList.add('is-visible');
    winTimer = setTimeout(() => {
      boardEl.classList.remove('is-flashing');
      boardEl.classList.add('is-assembled');
    }, FLASH_MS);
  }

  /* ------------------------------- оригинал ------------------------------- */

  function toggleOriginal(force) {
    if (!grid || solved) return;
    showingOriginal = force === undefined ? !showingOriginal : force;
    boardEl.classList.toggle('show-original', showingOriginal);
    if (showingOriginal) clearSelection();
    renderTexts();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  return { start, stop, fit, refresh: renderTexts };
})();
