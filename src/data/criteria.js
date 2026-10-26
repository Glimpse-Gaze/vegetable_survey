export const criteria = [
  { id: 'structure', label: 'Because of its structure' },
  { id: 'cooking', label: 'Because of how you consume it' },
  { id: 'underground', label: 'Because of how it grows, or how it’s harvested'},
  { id: 'appearance', label: 'Because of how it looks'},
  { id: 'healthy', label: 'It’s considered healthy' },
  { id: 'local', label: "I’m often exposed to it" },
  { id: 'plant', label: 'It’s a specific part of a plant' },
  { id: 'taste', label: 'Because of it’s taste' },
  { id: 'childhood', label: "It’s something I grew up eating" },
  { id: 'just_feels', label: 'It just feels like a vegetable to me' },
  { id: 'other', label: 'Something else' },
];

export const MAX_CUSTOM_CRITERION = 50;

const PINNED_CRITERIA_IDS = ['just_feels', 'other'];

export function shuffleCriteria(items) {
  const pinned = PINNED_CRITERIA_IDS.map((id) =>
    items.find((item) => item.id === id),
  ).filter(Boolean);
  const rest = items.filter((item) => !PINNED_CRITERIA_IDS.includes(item.id));

  for (let index = rest.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [rest[index], rest[swapIndex]] = [rest[swapIndex], rest[index]];
  }

  return [...rest, ...pinned];
}
