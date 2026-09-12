'use strict';

const IMAGES = [
  {
    id: 'landscape-1',
    url: 'https://i.pinimg.com/originals/42/8d/34/428d341c536d18cfdacdaff79934de2d.jpg',
    orientation: 'landscape',
    title: { ru: 'Горная река', en: 'Mountain River' },
  },
  {
    id: 'portrait-1',
    url: 'https://i.pinimg.com/originals/c1/a0/b5/c1a0b545045142b5ecf53d45053e809b.png',
    orientation: 'portrait',
    title: { ru: 'Портрет', en: 'Portrait' },
  },
  {
    id: 'square-1',
    url: 'https://i.pinimg.com/originals/e9/74/eb/e974ebb594996130e014f4952aae7ac0.jpg',
    orientation: 'square',
    title: { ru: 'Лес', en: 'Forest' },
  },
  {
    id: 'landscape-2',
    url: 'https://images.thevoicemag.ru/upload/img_cache/4cf/4cfd402884951db60028fff41dfeed21_ce_1800x945x302x0_cropped_1200x628.jpg',
    orientation: 'landscape',
    title: { ru: 'Супермодели', en: 'Supermodels' },
  },
  {
    id: 'portrait-2',
    url: 'https://i.pinimg.com/originals/22/7d/bc/227dbca566bd6421bcca5fc0b86d6919.jpg',
    orientation: 'portrait',
    title: { ru: 'Парный портрет', en: 'Pair Portrait' },
  },
  {
    id: 'square-2',
    url: 'https://i.pinimg.com/originals/a8/75/a4/a875a45c993d0bdcce3755c91499e6ff.jpg',
    orientation: 'square',
    title: { ru: 'Монако', en: 'Monaco' },
  },
];

/** Кэш натуральных размеров: id -> { width, height } */
const naturalSizes = new Map();

/** Загружает картинку и возвращает её натуральные размеры. */
function loadImageSize(image) {
  const cached = naturalSizes.get(image.id);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const size = { width: img.naturalWidth, height: img.naturalHeight };
      naturalSizes.set(image.id, size);
      resolve(size);
    };
    img.onerror = () => reject(new Error('image load failed: ' + image.id));
    img.src = image.url;
  });
}
