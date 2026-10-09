import { criteria } from '../../data/criteria.js';

export const en = {
  progress: 'Question {number} out of {total}',
  nav: {
    back: 'Back',
    continue: 'Continue',
  },
  dialog: {
    proceed: 'Proceed',
    cancel: 'Cancel',
  },
  home: {
    language: 'Language',
    eyebrow: 'A folk concept study',
    title: 'The Great Vegetable Survey',
    question: 'What do people count as a vegetable?',
    lede: 'Take the survey or skip ahead to the interactive results.',
    takeSurvey: 'Take the survey',
    seeResults: 'See the results',
    skipTitle: 'Before you skip ahead',
    skipMessage:
      "Please note: it's recommended to complete the survey before displaying the results.",
  },
  welcome: {
    eyebrow: 'Welcome',
    intro:
      "This is a short survey examining what people consider to be a vegetable. It's designed to be a fun way to learn about people's thoughts and opinions. It takes about seven minutes to complete it.",
    noBadAnswers:
      'There are no bad answers. Use your intuition and feel free to submit personal opinions.',
    languagePrompt:
      'This survey is best in your mother tongue. Please choose one of the supported languages:',
    backHint: 'Return to the main page',
  },
  privacy: {
    title: 'Privacy notice',
    saved:
      'Because of the nature of this project, your responses will be saved, and some will be made available to the public in the Results page.',
    unlink:
      'Your responses will not be linked to you personally in any way. One optional question asks about your birthplace and native language. This is only used to add nuance to the results and can be skipped.',
    consent: 'I agree for my answers to be used in this research.',
    backHint: 'Return to the introduction',
    continueHint: 'Please agree so we can store your answers',
  },
  q1: {
    title: 'Which vegetable comes to your mind when you hear the word "vegetable"?',
    micro: 'Go with your first instinct. There are no wrong answers.',
    label: 'Type which vegetable comes to your mind',
    placeholder: 'Type your first instinct...',
  },
  q2: {
    title: 'Why does “{answer}” feel vegetabley for you?',
    micro: 'Please choose up to 5 criteria.',
    whatElse: 'What else?',
    placeholder: 'Type your own reason...',
    publicConsent: 'I agree to display this answer publicly.',
    continueHint: 'Select at least one',
  },
  criteria: Object.fromEntries(criteria.map((item) => [item.id, item.label])),
  q3: {
    title: 'Which of these count as vegetables?',
    lead: 'Sort each item into a bucket.',
    fine: 'Drag the items, or click a bucket and then an item.',
    coarse:
      'Tap a bucket, then an item — or tap an item, then a bucket. Hold an item to drag it. Tap × on a sorted item to put it back.',
    continueHint: 'Sort every item',
    toSort: 'Items to sort',
    returnItem: 'Return {name} to the list',
  },
  buckets: {
    not_vegetable: 'Not a vegetable',
    in_between: 'Something in-between',
    definitely_vegetable: 'Definitely a vegetable',
  },
  q4: {
    title: 'How vegetabley does each of these feel to you?',
    lead:
      'Place each item on the vegetableness spectrum. Least vegetabley items at the top, most vegetabley at the bottom.',
    fine: 'Drag and drop, or click a slot and then an item. Use arrows to nudge a placed item up or down.',
    coarse:
      'Tap a rank, then an item — or tap an item, then a rank. Hold an item to drag it. Use the arrows to move it, or × to put it back.',
    continueHint: 'Place all ten items',
    least: 'Least vegetabley',
    most: 'Most vegetabley',
    toPlace: 'Items to place',
    moveUp: 'Move {name} up',
    moveDown: 'Move {name} down',
    returnItem: 'Return {name} to the list',
  },
  q5: {
    title: 'What is the most vegetable vegetable?',
    micro:
      'Which consumable plant feels like the ideal example of a vegetable? You can choose freely.',
    label: 'Type the most vegetable vegetable',
    placeholder: 'Type the most vegetable vegetable...',
  },
  q6: {
    title: 'What makes something feel like a vegetable?',
    micro:
      'Which criteria did you use to rank the plants and pick the most vegetable of them all? Write freely. There are no wrong answers.',
    label: 'Your description',
    placeholder: 'Type whatever comes to mind...',
    publicConsent: 'I agree to display this answer publicly.',
    skipTitle: 'Skip this one?',
    skipMessage: "Are you sure you don't want to share your thought process?",
  },
  q7: {
    title: 'Would you mind sharing your background?',
    micro:
      'Skip either question if you’d rather not say. If your answer is not on the list, you can also type it freely.',
    grewUp: 'In which country or region did you grow up?',
    grewUpPlaceholder: 'Country, region, or continent...',
    language: 'What is your native language?',
    languagePlaceholder: 'Type a native language...',
    preferNot: 'I prefer not to disclose',
    doubt: "I don't believe you.",
    removeLanguage: 'Remove {name}',
    saving: 'Saving your answers…',
  },
  thanks: {
    title: 'That’s all — thank you.',
    resultsTitle: 'Interactive results',
    resultsBody:
      'On the results pages you can see how your answers compare globally, and rate other people’s comments.',
    resultsButton: 'See the results',
    codeTitle: 'Your ranking code',
    codeBody:
      'Keep this code if you want to reopen your rankings later, or send it to someone so they can see how you voted.',
    copy: 'Copy',
    copied: 'Copied',
    commentsTitle: 'Do you have any comments?',
    commentsBody:
      'Optional note for the developer. Just for user feedback, it won’t be shown publicly and won’t be used in the research.',
    commentsLabel: 'Comments for the developer',
    placeholder: 'A bug, a thought, a vegetable grievance…',
    sent: 'Sent. Thank you.',
    send: 'Send note',
    sending: 'Sending…',
    sendError: 'Could not send the note.',
  },
  toast: {
    locked: 'First instinct locked. No wrong answers.',
    lockedBack: 'Your initial intuition is locked. There are no bad answers!',
    filled: 'Answers loaded from that ranking code.',
    saveError: 'Could not save your answers. Try again.',
    unknownCode: 'Unknown code.',
  },
  leave: {
    title: 'Leave the survey?',
    message: "Are you sure you want to return? Your answers won't be saved.",
  },
  codeFill: {
    label: 'Open a ranking code',
    placeholder: 'Paste a code…',
    open: 'Open',
    loading: 'Loading…',
    error: 'Could not load that code.',
  },
};
