export const DEV_SPEEDRUN = {
  initialAssociation: {
    rawAnswer: 'Broccoli',
    canonicalId: 'broccoli',
    selectionMethod: 'autocomplete',
  },
  initialCriteria: [
    'cooking',
    'healthy',
    'appearance',
    'plant',
    'common_label',
  ],
  customCriterion: '',
  sortBuckets: {
    not_vegetable: [
      'rhubarb',
      'cinnamon',
      'garlic',
      'ginger',
      'tobacco',
      'mushroom',
    ],
    in_between: ['pumpkin', 'cucumber', 'avocado', 'olive', 'tomato'],
    definitely_vegetable: [
      'potato',
      'cabbage',
      'spinach',
      'broccoli',
      'soybean',
      'lotus_root',
      'carrot',
      'bamboo_shoot',
      'onion',
    ],
  },
  spectrum: [
    'tomato',
    'cucumber',
    'lettuce',
    'carrot',
    'onion',
    'sweet_potato',
    'broccoli',
    'corn',
    'pea',
    'turnip',
  ],
  mostVegetable: {
    rawAnswer: 'Turnip',
    canonicalId: 'turnip',
    selectionMethod: 'autocomplete',
  },
  openDescription: {
    text: "It's something that's dense and have to be cooked to be consumed. It grows underground and can last a long time in a pantry.",
    publicDisplay: true,
  },
  background: {
    grewUp: {
      rawAnswer: 'Poland',
      canonicalId: 'poland',
      skipped: false,
    },
    languages: {
      items: [
        { rawAnswer: 'Polish', canonicalId: 'polish' },
        { rawAnswer: 'English', canonicalId: 'english' },
      ],
      skipped: false,
    },
  },
};
