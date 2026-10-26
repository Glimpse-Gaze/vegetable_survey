# Q2 criteria migration report

**When:** 2026-10-26  
**Responses touched:** 65  
**Scope:** only `responses.payload.initialCriteria` (+ survey copy). Custom free-text left alone.

## Final roster (11)

`structure`, `cooking`, `underground`, `appearance`, `healthy`, `local`, `just_feels`, `plant`, `taste`, `childhood`, `other`

(`savoury` removed after a follow-up merge into `cooking` + `taste`.)

## Merges (pass 1)

| Absorbed | Into survivor | Dual-selects | Half-credit extras (`floor`) |
|---|---|---:|---:|
| `green` | `appearance` | 9 | 4 |
| `regularly_eaten` | `local` | 2 | 1 |
| `edible` | `plant` | 3 | 1 |
| `common_label` | `just_feels` | 7 | 3 |

## Savoury follow-up (pass 2)

11 `savoury` ballots: alone 3, +cooking only 1, +taste only 5, +both 2.

Each `savoury` vote split **0.5 → cooking** and **0.5 → taste** (duals checked for the log).  
`floor(5.5) = 5` extras each; leftover **0.5+0.5 dropped**.

| | Before pass 2 | After |
|---|---:|---:|
| savoury | 11 | **0** |
| cooking | 23 | **28** |
| taste | 34 | **39** |

Full row log: [`q2-savoury-merge-report.json`](./q2-savoury-merge-report.json)

## Vote totals (after both passes)

| Criterion | Original (pre-pass-1) | Final |
|---|---:|---:|
| appearance | 25 | **42** |
| just_feels | 16 | **42** |
| taste | 34 | **39** |
| healthy | 28 | 28 |
| cooking | 23 | **28** |
| local | 10 | **24** |
| plant | 13 | **23** |
| underground | 15 | 15 |
| childhood | 13 | 13 |
| other | 6 | 6 |
| structure | — | **0** |
| green / regularly_eaten / edible / common_label / savoury | (absorbed) | — |

## Code / i18n

- Canonical EN labels: `src/data/criteria.js` (11 ids)
- Old strings backup: [`criteria-i18n-backup-pre-q2-migration.json`](./criteria-i18n-backup-pre-q2-migration.json)
- Pass-1 machine log: [`q2-criteria-migration-report.json`](./q2-criteria-migration-report.json)

## Scripts

- `node scripts/backup-criteria-i18n.mjs`
- `node scripts/migrate-q2-criteria.mjs` (`--dry-run` supported)
- `node scripts/migrate-savoury-into-cooking-taste.mjs` (`--dry-run` supported)
- `node scripts/apply-q2-criteria-i18n.mjs`
