'use strict';

/** Допустимое число частей по меньшей стороне картинки. */
const MIN_PARTS = 5;
const MAX_PARTS = 11;

/**
 * Считает сетку для картинки naturalWidth x naturalHeight при делении
 * меньшей стороны на `parts` частей.
 *
 * Меньшая сторона всегда делится ровно на `parts`; размер плитки округляется
 * вниз, по большей стороне берётся максимальное целое число таких же плиток.
 * Остаток исходника обрезается симметрично (картинка центрируется в сетке).
 */
function computeGrid(naturalWidth, naturalHeight, parts) {
  const minSide = Math.min(naturalWidth, naturalHeight);
  const tile = Math.max(1, Math.floor(minSide / parts));

  let cols;
  let rows;
  if (naturalWidth === naturalHeight) {
    cols = parts;
    rows = parts;
  } else if (naturalWidth < naturalHeight) {
    cols = parts;
    rows = Math.floor(naturalHeight / tile);
  } else {
    rows = parts;
    cols = Math.floor(naturalWidth / tile);
  }

  const cropWidth = cols * tile;
  const cropHeight = rows * tile;

  return {
    parts,
    tile,
    cols,
    rows,
    count: cols * rows,
    cropWidth,
    cropHeight,
    offsetX: (naturalWidth - cropWidth) / 2,
    offsetY: (naturalHeight - cropHeight) / 2,
    naturalWidth,
    naturalHeight,
  };
}

/** Все варианты сложности для картинки. */
function computeAllGrids(naturalWidth, naturalHeight) {
  const grids = [];
  for (let parts = MIN_PARTS; parts <= MAX_PARTS; parts += 1) {
    grids.push(computeGrid(naturalWidth, naturalHeight, parts));
  }
  return grids;
}

/**
 * Фоновые свойства плитки (x, y) — только проценты, поэтому фрагмент
 * остаётся корректным при любом отображаемом размере сетки.
 *
 * background-size задаётся в долях плитки: (W / tile) x (H / tile).
 * Процент в background-position отсчитывается от (плитка - картинка),
 * отсюда position = (x * tile + offset) / (W - tile) * 100%.
 * Без обрезки формула сводится к x / (cols - 1) * 100%.
 */
function tileBackground(grid, x, y) {
  const { tile, naturalWidth, naturalHeight, offsetX, offsetY } = grid;
  const spanX = naturalWidth - tile;
  const spanY = naturalHeight - tile;
  const posX = spanX > 0 ? ((x * tile + offsetX) / spanX) * 100 : 0;
  const posY = spanY > 0 ? ((y * tile + offsetY) / spanY) * 100 : 0;

  return {
    size: pct(naturalWidth / tile) + ' ' + pct(naturalHeight / tile),
    position: round(posX) + '% ' + round(posY) + '%',
  };
}

/** Фон для целого поля: та же обрезанная область, что и в пазле. */
function croppedBackground(grid) {
  return {
    size:
      pct(grid.naturalWidth / grid.cropWidth) +
      ' ' +
      pct(grid.naturalHeight / grid.cropHeight),
    position: '50% 50%',
  };
}

function pct(ratio) {
  return round(ratio * 100) + '%';
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}
