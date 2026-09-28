import broccoli from '../content/Broccoli.jpg';
import brusselsSprouts from '../content/Brussel_sprouts.jpg';
import cabbage from '../content/Cabbage.jpg';
import carrots from '../content/Carrots.jpg';
import cauliflower from '../content/Cauliflower.jpg';
import celery from '../content/Celery.jpg';
import corn from '../content/Corn.jpg';
import onion from '../content/Onion.jpg';
import pakChoi from '../content/Pok_choi.jpg';
import potato from '../content/Potato.jpg';
import pumpkin from '../content/Pumpkin.jpg';
import tomato from '../content/Tomato.jpg';
import turnip from '../content/Turnips.jpg';

export const VEGETABLE_ART = {
  broccoli,
  brussels_sprouts: brusselsSprouts,
  cabbage,
  carrot: carrots,
  cauliflower,
  celery,
  corn,
  onion,
  pak_choi: pakChoi,
  potato,
  pumpkin,
  tomato,
  turnip,
};

export const VEGETABLE_LABELS = {
  broccoli: 'Broccoli',
  brussels_sprouts: 'Brussels sprouts',
  cabbage: 'Cabbage',
  carrot: 'Carrot',
  cauliflower: 'Cauliflower',
  celery: 'Celery',
  corn: 'Corn',
  onion: 'Onion',
  pak_choi: 'Pak choi',
  potato: 'Potato',
  pumpkin: 'Pumpkin',
  tomato: 'Tomato',
  turnip: 'Turnip',
};

const FIRST_INSTINCT_VOTES = {
  tomato: 186,
  carrot: 142,
  broccoli: 98,
  potato: 71,
  onion: 54,
  cabbage: 41,
  corn: 33,
  pumpkin: 22,
  cauliflower: 18,
  celery: 14,
  pak_choi: 9,
  turnip: 7,
  brussels_sprouts: 5,
};

const MOST_VEGETABLE_VOTES = {
  turnip: 131,
  broccoli: 108,
  cabbage: 91,
  carrot: 79,
  potato: 67,
  onion: 54,
  celery: 48,
  pak_choi: 40,
  corn: 29,
  brussels_sprouts: 22,
  cauliflower: 17,
  pumpkin: 9,
  tomato: 5,
};

function rankBoard(votesById) {
  const total = Object.values(votesById).reduce((sum, n) => sum + n, 0);
  return Object.entries(votesById)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, votes], index) => ({
      id,
      name: VEGETABLE_LABELS[id],
      art: VEGETABLE_ART[id],
      votes,
      total,
      share: votes / total,
      rank: index + 1,
    }));
}

export const RESULTS_MOCK = {
  responseCount: 700,
  sections: [
    {
      id: 'first-instincts',
      eyebrow: 'Question 1',
      title: 'First instincts',
      prompt: 'Which vegetable comes to mind first?',
      userVoteId: 'broccoli',
      items: rankBoard(FIRST_INSTINCT_VOTES),
    },
    {
      id: 'most-vegetable',
      eyebrow: 'Question 5',
      title: 'The most vegetable vegetable',
      prompt: 'What feels most vegetabley?',
      userVoteId: 'turnip',
      items: rankBoard(MOST_VEGETABLE_VOTES),
    },
  ],
};
