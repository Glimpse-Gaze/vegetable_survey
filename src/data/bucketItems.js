export const BUCKET_IDS = [
  'not_vegetable',
  'in_between',
  'definitely_vegetable',
];

export const bucketLabels = {
  not_vegetable: 'Not a vegetable',
  in_between: 'Somewhere in-between',
  definitely_vegetable: 'Definitely a vegetable',
};

export const bucketItems = [
  { id: 'broccoli', name: 'Broccoli', family: 'Brassicaceae' },
  { id: 'onion', name: 'Onion', family: 'Amaryllidaceae' },
  { id: 'tomato', name: 'Tomato', family: 'Solanaceae' },
  { id: 'cabbage', name: 'Cabbage', family: 'Brassicaceae' },
  { id: 'spinach', name: 'Spinach', family: 'Amaranthaceae' },
  { id: 'carrot', name: 'Carrot', family: 'Apiaceae' },
  { id: 'cucumber', name: 'Cucumber', family: 'Cucurbitaceae' },
  { id: 'garlic', name: 'Garlic', family: 'Amaryllidaceae' },
  { id: 'potato', name: 'Potato', family: 'Solanaceae' },
  { id: 'pumpkin', name: 'Pumpkin', family: 'Cucurbitaceae' },
  { id: 'bamboo_shoot', name: 'Bamboo shoot', family: 'Poaceae' },
  { id: 'lotus_root', name: 'Lotus root', family: 'Nelumbonaceae' },
  { id: 'soybean', name: 'Soya bean', family: 'Fabaceae' },
  { id: 'olive', name: 'Olives', family: 'Oleaceae' },
  { id: 'avocado', name: 'Avocado', family: 'Lauraceae' },
  { id: 'mushroom', name: 'Mushroom', family: 'Fungi' },
  { id: 'rhubarb', name: 'Rhubarb', family: 'Polygonaceae' },
  { id: 'turmeric', name: 'Turmeric', family: 'Zingiberaceae' },
  { id: 'cinnamon', name: 'Cinnamon', family: 'Lauraceae' },
  { id: 'tobacco', name: 'Tobacco', family: 'Solanaceae' },
  { id: 'bell_pepper', name: 'Bell pepper', family: 'Solanaceae' },
  { id: 'horseradish', name: 'Horseradish', family: 'Brassicaceae' },
  { id: 'pea', name: 'Pea', family: 'Fabaceae' },
  { id: 'pak_choi', name: 'Pak choi', family: 'Brassicaceae' },
  { id: 'rocket', name: 'Rocket', family: 'Brassicaceae' },
];

export function emptyBuckets() {
  return {
    not_vegetable: [],
    in_between: [],
    definitely_vegetable: [],
  };
}

export function getBucketItem(id) {
  return bucketItems.find((item) => item.id === id) ?? null;
}

export function placedBucketIds(buckets) {
  return BUCKET_IDS.flatMap((bucketId) => buckets?.[bucketId] ?? []);
}

export function isCompleteBuckets(buckets) {
  if (!buckets) return false;
  const placed = placedBucketIds(buckets);
  const unique = new Set(placed);
  return (
    unique.size === bucketItems.length &&
    placed.every((id) => getBucketItem(id))
  );
}
