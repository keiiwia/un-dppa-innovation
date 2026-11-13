# Source Gatherer playtest (Venezuela scenario)
Current scenario: the US capture of Nicolás Maduro, Jan 3–16, 2026. `scraper.js` simulates the scraper over the prepared catalog, but next steps will integrate Open Media to act as the scraper

## Run it locally:
Serve this folder with any local server, for example:

```bash
npx serve .
```
The scope illustrations animate where the browser supports WebGPU (`art/`, using Figma's `@figma/expressive-components`). Elsewhere, on small screens, and with reduced motion switched on, the static images in `assets/img/` show instead. After editing anything in `art/`, rebuild the bundle:

```bash
npm install && npm run build:art
```

Check the mock scraper and the catalog:

```bash
node test.js
```

## The flow
1. **Scope (what / when / where / who):** One question per screen. Text inputs with suggestion tags; "when" is a date-range calendar; "where" is a full-screen map (MapLibre + OpenFreeMap tiles, as in `quiet-or-unheard-map`) with place search from Photon. Search text is sent to photon.komoot.io; map clicks and region outlines go to nominatim.openstreetmap.org. If the map library can't load, "where" falls back to a plain text box
2. **Search:** Simulated. The catalog is read class by class; each source found lands on a visual stack, then the stack gives way to the list
3. **Select:** A table with checkboxes, with the scope summarised in a sidebar (each part editable). Click a row to open the source panel + "Add a source" lets the analyst add their own link. Going on to the workspace widens from the picks (related sources, plus classes the picks left out)
4. **Workspace:** Node map of connected ideas etc + reviewing more articles 
5. **Correlation map:** One dot per source on a world map, scatter or groups (d3), opened from the workspace or the pagination 

The workspace also shows three **simulated teammates** (`data/team.js`): their notes appear as numbered squares on nodes and list rows and in the source panel, and their connections are drawn in their colour. None of it is real or synced.

Sessions save in the browser, "start over" clears all data

## Design decisions to check
- **Credibility is shown as facts:** Each source lists how it was read, how it knows what it says, whether its sources are named, and any published fact-check finding, will probably need to add more considerations for credibility
- **Picks can't narrow the whole view:** The scraper adds sources from classes the analyst did not pick, labeled "Semi-related" on Screen 4/workspace
- **The system draws no connections/initialjudgment:** Up to the analyst to make whatever conncetions they determine
- **Class and provenance are always visible (from the Nov playtest feedback):** Every row carries its source class as a shaped glyph, and the map draws each class as a different node shape (circle traditional, rotated square local, diamond regional, hexagon UN, triangles academic/satellite, pentagon ground). The workspace has a coverage strip counting sources by class and by origin ("how it knows"). Clicking a chip filters the list, and empty classes show dashed. The source panel has a "Behind this source" section that explains the origin and lists the documented chain (checks / checked by, reports on, same origin as). "Checks this" and "Reports on" connections draw as arrows on the map
- **Whose voice, not just which outlet:** Every quoted speaker maps to a voice (US government, Venezuelan government, Cuban government, Russian state media, United Nations, US Congress, court records, news outlets, fact-checkers/OSINT, academics, civil society, or "Affiliation not confirmed"). Official statements say whose they are ("Official · Venezuelan government" vs "Official · United Nations"), "Who says what" tags each speaker with their voice, role and who relayed them, and the coverage strip's "Whose voices" row counts and filters sources by voice. Governments are outlined solid, the UN in UN blue, state media and unconfirmed affiliations dashed

## The catalog
`data/catalog.js` has 51 entries, this will probably need to be replaced with the actual web scraper eventually

| Read status | Meaning | Entries |
| --- | --- | --- |
| Text read | Page opened and read | Most entries |
| Search text only | Page would not open, so the summary uses search-result text | Includes BBC "Spies, drones and blowtorches", Chatham House, NPR's UN story |
| Not read | Only the link or title is known | Both YouTube videos, AFP Fact Check, State Department page, two Instagram posts, the X link |


## Stuff to consider/work on
- Dates for the unreadable Instagram and X links come from their post IDs, would need ot make this clear
- Most social posts are understood/processed by the scraper only through the fact-checks that describe them semantically, how do we analyze media like social posts?
- Speaker affiliations (`SPEAKERS` / `VOICES` in `data/catalog.js`) were assigned by hand for the playtest. A real scraper would have to infer them, and roles change over time (Delcy Rodríguez went from Vice President to acting leader inside the window). Nahum Fernández is left as "Affiliation not confirmed" because the CBS piece doesn't say who he is
- Voices count sources, not claims: a source that quotes Trump five times counts once for "US government"
- The provenance chain only goes as deep as the 21 documented links in `CATALOG_LINKS`. A real scraper would have to work out "who is behind whom" itself (wire bylines, "according to" attributions)
- The source panel can't show most websites inside the page because publishers block embedding (YouTube entries embed, the rest show a summary and an "Open the original" link)
