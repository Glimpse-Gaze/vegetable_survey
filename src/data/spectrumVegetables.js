export const SLOT_COUNT = 10;

export const spectrumVegetables = [
  { id: 'broccoli', name: 'Broccoli', family: 'Brassicaceae' },
  { id: 'carrot', name: 'Carrot', family: 'Apiaceae' },
  { id: 'tomato', name: 'Tomato', family: 'Solanaceae' },
  { id: 'turnip', name: 'Turnip', family: 'Brassicaceae' },
  { id: 'pea', name: 'Pea', family: 'Fabaceae' },
  { id: 'corn', name: 'Corn', family: 'Poaceae' },
  { id: 'onion', name: 'Onion', family: 'Amaryllidaceae' },
  { id: 'lettuce', name: 'Lettuce', family: 'Asteraceae' },
  { id: 'cucumber', name: 'Cucumber', family: 'Cucurbitaceae' },
  { id: 'sweet_potato', name: 'Sweet potato', family: 'Convolvulaceae' },
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
