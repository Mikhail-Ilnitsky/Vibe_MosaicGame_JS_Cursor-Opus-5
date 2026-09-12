'use strict';

const STRINGS = {
  ru: {
    appTitle: 'Игра-мозаика',
    galleryLead: 'Выберите картинку',
    levelsLead: 'Выберите сложность',
    levelsHint: 'Число частей по меньшей стороне картинки',
    tiles: 'плиток',
    exit: 'Выход',
    moves: 'Ходы',
    showOriginal: 'Показать оригинал',
    hideOriginal: 'Скрыть оригинал',
    winTitle: 'У вас получилось!',
    winMoves: 'Ходов: {n}',
    newGame: 'Начать новую игру',
    loading: 'Загрузка картинки…',
    loadError: 'Не удалось загрузить картинку',
  },
  en: {
    appTitle: 'Mosaic Game',
    galleryLead: 'Choose a picture',
    levelsLead: 'Choose difficulty',
    levelsHint: 'Number of parts along the shorter side',
    tiles: 'tiles',
    exit: 'Exit',
    moves: 'Moves',
    showOriginal: 'Show original',
    hideOriginal: 'Hide original',
    winTitle: 'You did it!',
    winMoves: 'Moves: {n}',
    newGame: 'Start a new game',
    loading: 'Loading image…',
    loadError: 'Could not load the image',
  },
};

const LANG_STORAGE_KEY = 'mosaic.lang';

/** Язык по умолчанию: из сохранённого выбора, иначе из navigator.language. */
function detectLang() {
  let saved = null;
  try {
    saved = localStorage.getItem(LANG_STORAGE_KEY);
  } catch (err) {
    saved = null;
  }
  if (saved === 'ru' || saved === 'en') return saved;

  const nav = (navigator.language || '').toLowerCase();
  return nav.includes('ru') ? 'ru' : 'en';
}

let currentLang = detectLang();

function getLang() {
  return currentLang;
}

/** Возвращает строку перевода с подстановкой {ключей}. */
function t(key, params) {
  const dict = STRINGS[currentLang] || STRINGS.en;
  let text = dict[key] != null ? dict[key] : key;
  if (params) {
    Object.keys(params).forEach((name) => {
      text = text.replace('{' + name + '}', params[name]);
    });
  }
  return text;
}

/** Меняет язык и перерисовывает все переводимые узлы. */
function setLang(lang, onChange) {
  currentLang = STRINGS[lang] ? lang : 'en';
  try {
    localStorage.setItem(LANG_STORAGE_KEY, currentLang);
  } catch (err) {
    /* приватный режим — просто игнорируем */
  }
  document.documentElement.lang = currentLang;
  applyTranslations();
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.lang === currentLang);
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === currentLang));
  });
  if (typeof onChange === 'function') onChange(currentLang);
}

/** Переводит статическую разметку: data-i18n и data-i18n-title. */
function applyTranslations(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
}
