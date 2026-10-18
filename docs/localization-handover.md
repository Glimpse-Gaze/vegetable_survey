# Localization handover

This is the guide for continuing Simplified Chinese, or for adding another language. Polish (`pl`) is the reviewed model. Chinese (`zh`) is the first pass built the same way, plus search and typography that Latin languages do not need.

The work is on branch `localization2` (commit `326e235`, “Chinese loc”). English is still the source catalog. A missing string or name falls back to English. Stable ids (`carrot`, `poland`, `mandarin`) stay English in stored answers, URLs, and the database. Only labels change.

`README.md` still describes the app as English + Polish. Update it when the locale list changes.

## What gets localized

Three layers. A new language needs all three, or the UI will mix English names into translated chrome.

### 1. UI messages

`src/i18n/messages/<id>.js`, registered in `src/i18n/messages/index.js`.

This is every button, question, hint, result heading, and sentence template. Keys must match `src/i18n/messages/en.js`. `t('results.youVotedFor')` looks up the active bundle, then English. Interpolation is `{name}` replacement only. There is no plural library: English ordinals (`one` / `two` / `few` / `other`) are separate keys, and a language that does not inflect can point them all at the same pattern (Chinese uses `第{n}` for every one).

`home.title` is also `document.title`.

### 2. Name lexicon

`src/i18n/lexicon/<id>/` with `vegetables.js`, `countries.js`, `languages.js`, and `index.js` exporting `{ vegetables, countries, languages }`. Register the bundle in `src/i18n/lexicon/index.js`.

`applyLexicon` (`src/i18n/applyLexicon.js`) overlays this onto the English catalogs at render time:

- A string is the display name.
- An array’s first string is the display name. Later strings are search aliases.
- The English name stays searchable unless it is identical to the display name.

The lexicon must cover every id in:

- `src/data/vegetables.js` (the autocomplete list; `soybean` is duplicated in the English file, and suggestions are deduped by id)
- `src/data/bucketItems.js` (question 3; includes ids that are not in the main list, notably `pak_choi`, `rocket`, `bamboo_shoots`)
- `src/data/spectrumVegetables.js` (question 4; the corn id is `corn`, not `sweetcorn`)
- `src/data/countries.js` and `src/data/languages.js`

A missing id silently shows the English name.

### 3. Flavor copy that is not a UI key

These are parallel arrays or objects, keyed like the English originals. Same ids, same `boosts`. Do not renumber them.

| Content | English source | Polish | Chinese |
| --- | --- | --- | --- |
| Spectrum note + fact (10 plants) | inline on the spectrum items | `src/i18n/lexicon/pl/spectrumCopy.js` | `src/i18n/lexicon/zh/spectrumCopy.js` |
| Mock “why vegetabley” comments | `src/data/reasonResults.js` | `reasonComments.pl.js` | `reasonComments.zh.js` |
| Mock open definitions | `src/data/noteResults.js` | `noteResults.pl.js` | `noteResults.zh.js` |

Wire spectrum copy in `src/i18n/localizeResults.js` (`SPECTRUM_COPY`). Wire comments and notes in `reasonResults.js` and `noteResults.js`. Free-text pools stay separate per locale: a Chinese reader should not see Polish notes, and the other way around. The flair string (`results.reasons.localeFlair`, `results.notes.setOf`) names the language of that pool.

## How a locale is switched on

1. Add `{ id, nativeName, htmlLang }` to `LOCALES` in `src/i18n/locales.js`. `htmlLang` is what goes on `<html lang>`. Chinese uses `zh-Hans`, not `zh`.
2. Add the message bundle and the lexicon bundle (above).
3. Teach `numberLocale()` in `locales.js` the `Intl` tag (`pl-PL`, `zh-CN`, default `en-GB`). Vote counts, progress, and map figures use this.
4. Paths are already `/{locale}/...`. `src/i18n/paths.js` builds the prefix from `LOCALES`, so a new id works without a regex edit. The switcher is `LocaleSwitcher`. Choice is stored as `veg-survey-locale`.
5. `I18nProvider` sets `document.documentElement.lang` and `document.title`.

Survey answers are not translated when the user changes language mid-flow. The catalog re-labels by id. Stored payloads keep the English id.

## Style

Polish is the tone to copy, not a line-by-line translation of English.

- Voice of the product: a person made this for fun. Warm, direct, a little wry. Not a ministry, not a textbook, not marketing. Chinese uses 你, not 您.
- “Vegetable” is a folk idea. Copy can say so. Do not turn questions into a botany exam.
- Regional color belongs in names and in the spectrum notes, the way Polish keeps the Taíno origin of *batat* on the sweet-potato fact. Keep the shared botanical story, then add the local name, the kitchen, or the history a speaker of that language would actually recognize.
- Proper nouns that are the product brand stay as written: Glimpse & Gaze.
- The info button on result sections is the Latin letter **i**. It is not a translation key. Do not redraw it in a CJK font (see Typography).
- Punctuation follows the language. Chinese running text uses `。` `，` `“”`. Templates must not leave a Latin space before those marks.

## Result sentences are the hard part

Do not translate the English sentence and keep English word order. The page assembles one line from pieces. Chinese reads well only because those pieces were rewritten as clauses.

Alignment card (`src/pages/Results.jsx`, `alignmentCopy` and the JSX around the alignment body):

```text
你投了番茄。它在全球排第3。
你投了番茄。它在普通话母语者中领先。
你投了番茄。它没能进入全球前10名。
```

The pieces:

| Key | Chinese | Why |
| --- | --- | --- |
| `youVotedFor` | 你投了 | Verb is unfinished until the name arrives. |
| `it` / `itIs` | 它 | One form. 是 is inside the outcome, not here. |
| `worldwide` | 全球 | Used as a place word. |
| `inPlace` | `{place}` | No “in”. |
| `amongSpeakers` | `{language}母语者中` | Global + a language. |
| `amongSpeakersIn` | `{language}母语者（{place}）中` | Language and place. |
| `leading` | 在{place}领先 | Place before the verb. |
| `ordinalPlace` | 在{place}排{rank} | `rank` is already `第3`. |
| `placedBelow` | 没能进入{place}前{size}名 | |
| `shareVoted` | `{share}的{people}和你投得一样` | No space after `%`. |
| `onlyShare` | 只有{share}的{people}和你投得一样 | |
| `people` / `speakers` | 人 / `{language}母语者` | |
| `ordinal.*` | 第{n} | |
| `vote` / `votes` | 票 | Chinese does not pluralize the noun. |

`formatVotes` omits the space before 票 when `numberLocale` starts with `zh`. Other languages get `"12 votes"`.

Bucket cards join share + verb in one template string so a JSX line break cannot insert a space:

```text
66%的人认为蘑菇不是蔬菜
58%的人把大蒜放在了中间
80%的人认为西兰花是蔬菜
```

English and Polish strings already contain their own spaces (` of people agree that `). Chinese strings do not. The vegetable name is a separate `<strong>`, so a space on either side of the name is acceptable; a space before 的 or before a Chinese comma is not.

The survey gate is the same trap. The link and the tail must be adjacent in JSX:

```jsx
<Link>…</Link>{t('results.gate.toVote')}
```

`toVote` / `toCompare` for Chinese begin with `，`. A newline or space between the tags becomes `问卷 ，`.

Criteria (`criteria.*`) are full clauses (`它是绿色的`) because the reason summary is `的人选择了` + the clause.

If you add a language whose grammar is not “subject verb object” or that does not use spaces, read the JSX in `Results.jsx`, `BucketColumns.jsx`, `ReasonResults.jsx`, and `SurveyGate.jsx` before translating the keys. Change the template, not the component, unless the component is inserting whitespace the language cannot have.

## Chinese naming decisions

These were chosen so one search string cannot mean two cards. They still need a human reviewer. The header of `src/i18n/lexicon/zh/vegetables.js` lists them, and the turnip / green-bean / onion facts explain the same choices to the reader.

| English id | Label on screen | Also finds it | Does not mean |
| --- | --- | --- | --- |
| `bok_choy`, `pak_choi` | 小白菜 | 白菜, 青菜, 小菜, 上海青 | Napa. Northern Mandarin often uses bare 白菜 for napa; this survey does not. |
| `napa_cabbage` | 大白菜 | 大菜, 黄芽白, 结球白菜, 绍菜, 黄芽菜 | Bare 白菜. |
| `yardlong_bean` | 长豇豆 | 豇豆, 豆角 | Green bean. Southern 豆角 is the yardlong bean. |
| `green_bean` | 四季豆 | 芸豆, 菜豆, 玉豆 | 豆角. |
| `bell_pepper` | 甜椒 | 青椒, and other pepper names | Chili. 青椒 follows northern Putonghua. |
| `daikon` | 白萝卜 | 萝卜 | The small red radish. |
| `radish` | 樱桃萝卜 | 小红萝卜, 水萝卜 | 萝卜. |
| `carrot` | 胡萝卜 | 红萝卜, 甘笋 | Daikon. 红萝卜 is southern usage. |
| `spring_onion` | 小葱 | 香葱, 青葱, 大葱, 葱 | Leek. 大葱 is *Allium fistulosum*. |
| `leek` | 韭葱 | | 大葱. |
| `sweet_potato` | 红薯 | 番薯, 地瓜, 甘薯, 白薯 | Potato, yam. |
| `tomato` | 番茄 | 西红柿 | |
| `corn`, `sweetcorn` | 玉米 | 包谷, 棒子, 玉蜀黍, 珍珠米 | |
| `water_chestnut` | 马蹄 | 荸荠, 菱角 | The English catalog already mixes in water caltrop, so 菱角 is an alias. |
| `zha_cai` | 榨菜 | 大头菜 | 大头菜 is also other brassicas in some regions. |
| `yu_choy` | 油菜 | 菜薹, 油菜心 | Rapeseed, which is 油菜籽 (`rapeseed`). |
| `rocket`, `arugula` | 芝麻菜 | 火箭菜 | |
| `cabbage` | 卷心菜 | 圆白菜, 包菜, 洋白菜, 高丽菜, 甘蓝, 莲花白 | 白菜. |

Display names are Simplified. Traditional forms are search-only: 台灣 finds 台湾, 澳門 finds 澳门. Tibet stays 西藏, matching the existing region entry, with no extra political copy.

Pinyin and zhuyin are not written in the lexicon. Reviewers should check the characters. Readings are generated (next section) and can be wrong on polyphones. 芫荽 is one known case (`yan2 sui0`); tones are stripped for search, so it still matches.

## Search (Chinese only)

`src/i18n/zhPhonetics.js` uses `pinyin-pro` (`toneType: 'num'`, `type: 'array'`, `nonZh: 'removed'`, `v: true`) and turns numbered syllables into bopomofo. `j`/`q`/`x` + `u` is rewritten to ü before the zhuyin step. Tone 1 is unmarked; 2 ˊ, 3 ˇ, 4 ˋ; neutral tone is a leading ˙.

`useSurveyCatalog` loads that module only when `locale === 'zh'`, through `useSyncExternalStore`, so English and Polish do not download the dictionary. Until the chunk arrives (about one frame), character search works and pinyin/zhuyin do not.

`normalizeQuery` in `src/utils/normalization.js` is what autocomplete uses:

- ü/Ü/ǖ/ǘ/ǚ/ǜ become `v` **before** NFD. Doing it after turns ü into `u`, and 绿 (`lü`) stops matching `lv`.
- Tone marks, tone digits, apostrophes, and spaces are removed. `bai cai`, `baicai`, `bai2cai4`, and `ㄅㄞˊㄘㄞˋ` collapse to the same key.
- Han queries match from 1 character. Everything else needs 2. So 菜 already suggests, and `b` does not.
- Suggestions prefer a display-name prefix, then a shorter name, then `zh-CN` collation. Duplicate ids collapse to one row.

Checked examples: 白菜 / 小白菜 / baicai / ㄒㄧㄠˇㄅㄞˊㄘㄞˋ → pak choi labeled 小白菜; 大菜 / 大白菜 → napa; 白菜 is not napa; 红薯 / 地瓜 / digua → sweet potato; lvdou / ㄌㄩˋㄉㄡˋ → mung bean.

## Typography

Han glyphs fill the em box. Latin display type in this app is intentionally tight (line-height about 0.94–1.05, tight tracking). Do not loosen that globally.

Chinese overrides live only under `html[lang='zh-Hans']` in `src/styles/zh.css`, imported from `App.jsx`. Body is Noto Sans SC, display is Noto Serif SC, with system fallbacks (PingFang SC, Microsoft YaHei, Songti SC). `I18nProvider` injects the Google Fonts stylesheet (`#zh-hans-fonts`) only while the locale is Chinese, and removes it otherwise.

What the override changes: body line-height 1.6, eyebrow tracking, title line-height around 1.2–1.28 with letter-spacing 0, home title not uppercased, spectrum and bucket tiles a little taller (`--tile-h: 3.7rem`) so two-line labels are not clipped.

The `.question-note-button` in `results.css` is pinned to `"Segoe UI", system-ui, sans-serif`. Noto Sans SC draws a different italic **i**. Leave that pin in place for every language.

## Adding another language

Copy Polish, not Chinese, unless the new language also needs phonetic search or a different font.

1. Branch from current main.
2. `locales.js`: id, native name, `htmlLang`, `numberLocale`.
3. `messages/<id>.js` with every key in `en.js`. Register it.
4. `lexicon/<id>/` for vegetables, countries, languages. First string is the label. Extra strings are aliases a local speaker would type. Register it.
5. `spectrumCopy.js` for the ten spectrum ids. Keep the botany. Add one local fact where the language has a real name or story. Register it in `localizeResults.js`.
6. `reasonComments.<id>.js` and `noteResults.<id>.js`. Same ids and boosts as English. Register them. Rewrite the scenes into that kitchen (rice, market, pickle pot) instead of translating the English sentences word for word.
7. Read the result-sentence JSX. If the language uses spaces, follow English. If it does not, follow the Chinese templates and the whitespace rules above.
8. Add a font file only if the default stack cannot draw the script. Scope it to `html[lang='…']`. Do not change Latin metrics.
9. Walk `/<id>` in the browser: home, all seven questions, autocomplete, bucket tiles, spectrum board, and a results page. Submit once so the alignment card (“you voted…”) is visible. Check both a wide window and a phone width. Look for clipped tile labels and for spaces before punctuation.

`npm run dev` runs `predev`, which compresses content images with `sharp`. If that exits because `sharp` is missing, run `npm install` from the project folder. The script tells you that when the module fails to load.

## What is still open

- Chinese is a first pass for peer review. The naming table above is the decision list.
- Pinyin is dictionary-generated. A reviewer should correct characters, not hand-edit readings, unless a polyphone is so wrong that search fails.
- The alignment card was reviewed in code and the bucket sentences were checked in the browser. A full submit-and-compare pass on a real ballot is still the right check for “你投了…。它在…排第…。”
- Live free-text from the API is filtered by locale the same way as the mock pools. New languages get an empty live pool until someone writes in that language.
