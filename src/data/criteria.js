export const criteria = [
  { id: 'green', label: "It's green" },
  { id: 'plant', label: "It's not a fruit" },
  { id: 'underground', label: 'It grows underground' },
  { id: 'edible', label: 'It has leaves' },
  { id: 'cooking', label: "It's used in cooking" },
  { id: 'savoury', label: "It's usually used in savoury dishes" },
  { id: 'healthy', label: "It's healthy" },
  { id: 'appearance', label: 'It looks like a stereotypical vegetable' },
  { id: 'taste', label: 'It has a “vegetable” taste' },
  { id: 'regularly_eaten', label: "It's something I eat regularly" },
  { id: 'childhood', label: "It's something I grew up eating" },
  { id: 'common_label', label: "It's commonly called a vegetable" },
  { id: 'local', label: "It's common where I live" },
  { id: 'just_feels', label: 'It just feels vegetabley' },
  { id: 'other', label: 'Something else' },
];

export const MAX_CUSTOM_CRITERION = 100;

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
