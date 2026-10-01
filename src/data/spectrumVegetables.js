export const SLOT_COUNT = 10;

export const SPECTRUM_BANDS = [
  {
    id: 'least',
    title: 'Least vegetabley',
    ranks: [1, 2, 3],
  },
  {
    id: 'middle',
    title: 'In the middle',
    ranks: [4, 5, 6, 7],
  },
  {
    id: 'most',
    title: 'Most vegetabley',
    ranks: [8, 9, 10],
  },
];

export const SPECTRUM_METHOD =
  'These ten were chosen because they sit in different botanical families, or because they are different parts of the same family — root versus stem, leaf, flower, fruit, grain. The ranking is there to see whether botanical status, plant anatomy, or origin has any bearing on how vegetabley something feels.';

export const spectrumVegetables = [
  {
    id: 'broccoli',
    name: 'Broccoli',
    family: 'Brassicaceae',
    familyCommon: 'cabbage',
    origin: 'the Mediterranean',
    botany: 'a head of flower buds',
    kin: ['cauliflower', 'Brussels sprouts', 'kohlrabi', 'kale'],
    fact: 'Broccoli, native to the Mediterranean, is one of several vegetables bred from wild cabbage (Brassica oleracea). Broccolies are flower buds, while cauliflower are the curds; Brussels sprouts are side buds, kohlrabi is a swollen stem, and kale and cabbage are leaves.',
    note: 'Broccoli is a not-yet bouquet. Left alone, every bud will grow a yellow flower.',
  },
  {
    id: 'carrot',
    name: 'Carrot',
    family: 'Apiaceae',
    familyCommon: 'carrot',
    origin: 'Central Asia, around Afghanistan',
    botany: 'a taproot',
    kin: ['parsley', 'fennel', 'celeriac'],
    fact: 'Carrot originated in Central Asia, around Afghanistan. It is a taproot in the Apiaceae family. It is related to parsley, fennel, and celeriac, but the same family also gives us spices such as dill, cumin, and anise.',
    note: 'Orange-coloured carrots were cultivated in the Netherlands around the 16th century.',
  },
  {
    id: 'tomato',
    name: 'Tomato',
    family: 'Solanaceae',
    familyCommon: 'nightshade',
    origin: 'western South America',
    botany: 'a fruit — botanically a berry',
    kin: ['potato', 'bell pepper', 'aubergine', 'tobacco'],
    fact: 'Tomato originated in western South America. It is a fruit — botanically a berry — and belongs to the nightshade family (Solanaceae). Other familiar members include potato, bell pepper, aubergine, and tobacco.',
    note: 'The poster child of the fruit vs. vegetable debate.',
  },
  {
    id: 'turnip',
    name: 'Turnip',
    family: 'Brassicaceae',
    familyCommon: 'cabbage',
    origin: 'Europe and western Asia',
    botany: 'a swollen root',
    kin: ['broccoli', 'cabbage', 'radish', 'mustard'],
    fact: 'Turnip originated in Europe and western Asia. It is a swollen root, and belongs to the cabbage family (Brassicaceae). Other familiar members include broccoli, cabbage, radish, and mustard.',
    note: 'A brassica, like broccoli, but grown for the swollen root rather than the flower head.',
  },
  {
    id: 'celery',
    name: 'Celery',
    family: 'Apiaceae',
    familyCommon: 'carrot',
    origin: 'the Mediterranean wetlands',
    botany: 'a leaf stem',
    kin: ['dill', 'cumin', 'anise', 'carrot'],
    fact: 'Celery originated in the Mediterranean wetlands. It is a leaf stem in the same family as carrot (Apiaceae). Staying true to its spice relatives (dill, cumin, anise), celery seeds are used whole in pickles and breads, or ground into celery salt.',
    note: 'Celeriac is the same species, but grown for the root instead of the stalks.',
  },
  {
    id: 'corn',
    name: 'Corn',
    family: 'Poaceae',
    familyCommon: 'grass',
    origin: 'Mesoamerica',
    botany: 'a grain — the seed of a grass',
    kin: ['wheat', 'rice', 'barley', 'bamboo'],
    fact: 'Corn originated in Mesoamerica, domesticated from the wild grass teosinte. It is a cereal grain, and hence belongs to the grass family (Poaceae). This makes corn closely related to sugarcane, sorghum, and millet, and more distantly to rice and bamboo.',
    note: 'Yellow corn became the dominant strain only in the 20th century.',
  },
  {
    id: 'onion',
    name: 'Onion',
    family: 'Amaryllidaceae',
    familyCommon: 'amaryllis',
    origin: 'Central Asia',
    botany: 'a bulb',
    kin: ['garlic', 'leek', 'chive', 'shallot'],
    fact: 'Onion originated in Central Asia. It is a bulb, and belongs to the amaryllis family (Amaryllidaceae). Other familiar members include garlic, leek, chive, and shallot.',
    note: 'The layers are modified leaves. Unrelated to the ogre family.',
  },
  {
    id: 'lettuce',
    name: 'Lettuce',
    family: 'Asteraceae',
    familyCommon: 'daisy',
    origin: 'the eastern Mediterranean',
    botany: 'a leaf',
    kin: ['sunflower', 'artichoke', 'chicory', 'endive'],
    fact: 'Lettuce originated in the eastern Mediterranean. It is a leaf, and belongs to the daisy family (Asteraceae). Other familiar members include sunflower, artichoke, chicory, and endive.',
    note: 'In ancient Egypt, lettuce was a sacred sex symbol.',
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    family: 'Cucurbitaceae',
    familyCommon: 'gourd',
    origin: 'South Asia',
    botany: 'a fruit',
    kin: ['pumpkin', 'melon', 'courgette', 'squash'],
    fact: 'Cucumber originated in South Asia. It is a fruit, and belongs to the gourd family (Cucurbitaceae). Other familiar members include pumpkin, melon, courgette, and squash.',
    note: 'Cucumber was cultivated at least 3,000 years ago in the Indus Valley.',
  },
  {
    id: 'sweet_potato',
    name: 'Sweet potato',
    family: 'Convolvulaceae',
    familyCommon: 'morning glory',
    origin: 'Central and South America',
    botany: 'a storage root',
    kin: ['water spinach', 'bindweed'],
    fact: 'Sweet potato originated in Central and South America. It is a storage root, and belongs to the morning glory family (Convolvulaceae). The second most popular consumable member of this family is water spinach.',
    note: 'Sweet potato is not a potato! It is a root, while potatoes are stem tubers.',
  },
];

export function shuffleSpectrumVegetables(items) {
  const rest = [...items];

  for (let index = rest.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [rest[index], rest[swapIndex]] = [rest[swapIndex], rest[index]];
  }

  return rest;
}

export function emptySpectrumSlots() {
  return Array.from({ length: SLOT_COUNT }, () => null);
}

export function getSpectrumVegetable(id) {
  return spectrumVegetables.find((item) => item.id === id) ?? null;
}

export function bandForRank(rank) {
  return SPECTRUM_BANDS.find((band) => band.ranks.includes(rank)) ?? null;
}
