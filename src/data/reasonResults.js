import { criteria } from './criteria.js';
import { DEV_SPEEDRUN } from './devSpeedrun.js';

export const COMMENT_DISPLAY_COUNT = 22;

const REASON_VOTES = {
  cooking: 412,
  appearance: 318,
  plant: 287,
  common_label: 264,
  healthy: 241,
  underground: 198,
  green: 176,
  edible: 154,
  savoury: 141,
  regularly_eaten: 118,
  taste: 97,
  local: 84,
  childhood: 71,
  just_feels: 63,
};

export const REASON_COMMENTS = [
  { id: 'c01', text: 'If you can put it in a stew', boosts: 14 },
  { id: 'c02', text: 'My grandmother would call it one', boosts: 11 },
  { id: 'c03', text: "It's not dessert", boosts: 9 },
  { id: 'c04', text: 'You serve it next to meat', boosts: 8 },
  { id: 'c05', text: 'Needs salt, oil, and heat', boosts: 7 },
  { id: 'c06', text: 'Sits with the cabbages at the market', boosts: 7 },
  { id: 'c07', text: 'You have to cook it first', boosts: 6 },
  { id: 'c08', text: "It's savoury and a bit bitter", boosts: 6 },
  { id: 'c09', text: 'Grows in a garden bed, not on a tree', boosts: 5 },
  { id: 'c10', text: 'Something you hide in soup for children', boosts: 5 },
  { id: 'c11', text: 'Leaves, roots, or stems — never seeds', boosts: 4 },
  { id: 'c12', text: 'The opposite of a snack', boosts: 4 },
  { id: 'c13', text: 'Makes the plate look responsible', boosts: 3 },
  { id: 'c14', text: 'It stains the chopping board green', boosts: 3 },
  { id: 'c15', text: 'You buy it by the kilo, not the piece', boosts: 3 },
  { id: 'c16', text: 'Goes with potatoes more than with cake', boosts: 2 },
  { id: 'c17', text: 'A side dish that could be the whole dinner', boosts: 2 },
  { id: 'c18', text: "If it's pickled, it's probably a vegetable", boosts: 2 },
  { id: 'c19', text: 'You chop it on a wooden board', boosts: 2 },
  { id: 'c20', text: 'It belongs in a roasting tin', boosts: 2 },
  { id: 'c21', text: 'Something you forget in the crisper drawer', boosts: 1 },
  { id: 'c22', text: 'The bit of the meal that is good for you', boosts: 1 },
  { id: 'c23', text: 'It has no packaging personality', boosts: 1 },
  { id: 'c24', text: 'You eat it with a fork, not your hands', boosts: 1 },
  { id: 'c25', text: "It's what remains after you take away the meat", boosts: 1 },
  { id: 'c26', text: 'Sold loose, covered in dirt', boosts: 1 },
  { id: 'c27', text: 'A thing you salt because it is watery', boosts: 1 },
  { id: 'c28', text: 'You would grow it if you had a garden', boosts: 1 },
  { id: 'c29', text: 'It wilts, browns, or goes limp — never moulds like bread', boosts: 1 },
  { id: 'c30', text: 'The sound of a knife through it is a crunch', boosts: 1 },
  { id: 'c31', text: 'It needs a recipe, not a wrapper', boosts: 0 },
  { id: 'c32', text: 'Something your doctor would nod at', boosts: 0 },
  { id: 'c33', text: 'It can be the whole of a soup', boosts: 0 },
  { id: 'c34', text: 'Not sweet enough to be a fruit in the kitchen', boosts: 0 },
  { id: 'c35', text: 'It comes in a brown paper bag from the greengrocer', boosts: 0 },
  { id: 'c36', text: 'You hide cheese on it to make children eat', boosts: 0 },
  { id: 'c37', text: 'A Tuesday food, not a birthday food', boosts: 0 },
  { id: 'c38', text: 'It looks honest on a plate', boosts: 0 },
  { id: 'c39', text: 'Harvested, not baked', boosts: 0 },
  { id: 'c40', text: 'The smell when you fry the first pan of it', boosts: 0 },
  { id: 'c41', text: 'Leaves that taste of the garden after rain', boosts: 0 },
  { id: 'c42', text: 'You would take it to a potluck in a Pyrex dish', boosts: 0 },
  { id: 'c43', text: 'It is cheaper than meat and heavier than herbs', boosts: 0 },
  { id: 'c44', text: 'A thing you wash in the sink', boosts: 0 },
  { id: 'c45', text: 'It can be fermented, roasted, or boiled and still itself', boosts: 0 },
  { id: 'c46', text: 'The opposite of a pastry', boosts: 0 },
  { id: 'c47', text: 'Something that stains olive oil green', boosts: 0 },
  { id: 'c48', text: 'You say it is in season', boosts: 0 },
  { id: 'c49', text: 'It has a stalk, a leaf, or a bulb — a body', boosts: 0 },
  { id: 'c50', text: 'The food that makes a meal look finished', boosts: 0 },
];

const ROW_META = [
  { id: 'row-a', duration: '40s', reverse: false },
  { id: 'row-b', duration: '55s', reverse: true },
  { id: 'row-c', duration: '46s', reverse: false },
  { id: 'row-d', duration: '60s', reverse: true },
];

export function scoreComment(comment, net = 0) {
  return (comment.boosts ?? 0) + net;
}

export function rankComments(pool, nets = {}) {
  return [...pool]
    .map((comment) => ({
      ...comment,
      net: nets[comment.id] ?? 0,
      score: scoreComment(comment, nets[comment.id] ?? 0),
    }))
    .sort(
      (a, b) =>
        b.score - a.score || b.net - a.net || a.id.localeCompare(b.id),
    );
}

export function layoutCommentRows(ranked, limit = COMMENT_DISPLAY_COUNT) {
  const visible = ranked.slice(0, limit);
  const rowCount = ROW_META.length;
  const base = Math.floor(visible.length / rowCount);
  const extra = visible.length % rowCount;
  const sizes = ROW_META.map((_, index) => base + (index < extra ? 1 : 0));
  let offset = 0;

  return ROW_META.map((meta, index) => {
    const items = visible.slice(offset, offset + sizes[index]);
    offset += sizes[index];
    return { ...meta, items };
  }).filter((row) => row.items.length > 0);
}

export function getReasonsSection(category, region) {
  const labels = Object.fromEntries(criteria.map((item) => [item.id, item.label]));
  const userCriteria = new Set(category.userCriteria ?? DEV_SPEEDRUN.initialCriteria);
  const items = Object.entries(REASON_VOTES)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([id, votes], index) => ({
      id,
      name: labels[id] ?? id,
      votes,
      share: votes / region.votes,
      rank: index + 1,
      isYours: userCriteria.has(id),
    }));

  return {
    ...category,
    region,
    items,
    leader: items[0],
    commentPool: REASON_COMMENTS,
    responseCount: region.votes,
  };
}
