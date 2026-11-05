# Source Gatherer (Algorithm 1 · search)

The search half of the I/O logic flow in Figma ([UN Innovation DPPA Sprint → "logic flow"](https://www.figma.com/design/5bw6PelOEPxizVIQTvFvoP/UN-Innovation-DPPA-Sprint?node-id=14-65)). Algorithm 2 (historical resolution matcher) and the C1 cross-gate come later. The output already exposes `gapCategories` for C1 to use.

Styling is deliberately bare. The focus is the algorithm.

## Run it

Open `index.html` through any local server (scripts won't load from `file://` in every browser), e.g. from this folder:

```bash
npx serve .
```

Run the mock scenarios and gate checks:

```bash
node test.js
```

```bash
node test.js --verbose
```

## How a search flows

| Step | Figma node | What the code does (`algorithm.js`) |
| --- | --- | --- |
| Analyst input | ANALYST INPUT (mandatory) | Country, region (or "Country-wide"), issue type. |
| G0 | Scope lock | Any of the three missing → `STOP`. Nothing starts without human input. |
| Auto-derive | Auto-derive from scope | Languages (official + regional), bordering states, regional blocs, time window (conflict 365 d, protest 30 d, other 90 d). All overridable. |
| A1 | Issue class? | Maps the issue type to conflict / protest / other. |
| A2 | Sources in each local language? | A language is covered only by a source that names it **and** covers this country or region. User-generated platforms (`*`) don't count: they carry every language but index none. Missing → language gap, fed to A5. |
| A3 | Covers this geography AND issue? | Per phonebook source. Both → candidate. Some geographic tie but not both → "possibly relevant". No overlap → skipped. |
| A4 | Access tagging | Attaches cost, access, affiliation, platform, languages. Checks access events (shutdowns, throttling): ongoing + covering the scope area = not counted; past events in the window = context only. |
| A5 | ≥1 candidate in each of 7 classes? | Classes: traditional, local, regional, UN, academic, satellite, ground comms. Reduced-capacity or blocked sources are listed but not counted. An empty class raises a gap flag. |
| Gap flag | GAP FLAG (the missing data point) | Categories come from evidence only: `access blocked` (an ongoing event), `capacity` (sources marked reduced), `language/indexing` (A2 gaps, for local and ground classes), else `unknown`. |
| Output 1 | Filtered side panel | Grouped by class, gap flags pinned, shopping-site facets with live counts, plus possibly relevant, toolkit and a trace of every gate. |

Order inside a class is by geographic specificity (region > country > bordering state > regional bloc > global), then local-language publishing. It is never a credibility score, and every card says why it matched.

## Files

- `data/geo.js`: countries, regions, languages, borders, blocs, issue types, access events
- `data/phonebook.js`: the source and tool directory (the "phonebook")
- `algorithm.js`: the gates, pure functions, no DOM
- `ui.js`, `index.html`, `styles.css`: bare-bones panel
- `test.js`: mock scenarios

## Mock scenarios

1. **Active conflict, decentralized region:** Cameroon / Northwest / armed conflict. Expect Lamnso' and Cameroonian Pidgin language gaps (with BBC Pidgin surfaced as a related-language source) and an `access blocked` gap on ground comms from a mock throttling event.
2. **Protest:** Kenya / Nairobi / protest. All seven classes covered, Sheng flagged as unindexed. Widening the window to 3 years brings the June 2024 disruption in as context.
3. Sudan / West Darfur / armed conflict: Masalit and Fur gaps, ground comms blocked by a mock outage.

## Data caveats

Source URLs and affiliations are real as far as we know, but check them before relying on them. Anything labelled **mock** (the Bui throttling, the Darfur outage, reduced-coverage statuses, the field-colleague list, "UN field situation reports") is invented to exercise the gap logic. Language lists per region are a starting point, not a census.

## Adding to the phonebook

Add an object to `data/phonebook.js` with the fields documented at the top of that file. To add a country, add it to `GEO.countries` in `data/geo.js` with its regions and languages. Then add or extend a scenario in `test.js`.
