# Source Gatherer playtest (Venezuela scenario)
Current scenario: the US capture of Nicolás Maduro, Jan 3–16, 2026. `scraper.js` simulates the scraper over the prepared catalog, but next steps will integrate Open Media to act as the scraper

## Run it locally:
Serve this folder with any local server, for example:

```bash
npx serve .
```
Check the mock scraper and the catalog:

```bash
node test.js
```

## The flow
1. **Who / what / when / where:** Text inputs, for the playtest -> suggestion labels/tags
2. **Pick sources:** Currently a list with checkboxes + "Add a source" lets the analyst add their own link
3. **Loader:** Currently simulating
4. **Workspace:** Node map of connected ideas etc + reviewing more articles 
5. **Correlation map:** in progress...... 

Sessions save in the browser, "start over" clears all data

## Design decisions to check
- **Credibility is shown as facts:** Each source lists how it was read, how it knows what it says, whether its sources are named, and any published fact-check finding, will probably need to add more considerations for credibility
- **Picks can't narrow the whole view:** The scraper adds sources from classes the analyst did not pick, labeled "Semi-related" on Screen 4/workspace
- **The system draws no connections/initialjudgment:** Up to the analyst to make whatever conncetions they determine

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
- The source panel can't show most websites inside the page because publishers block embedding (YouTube entries embed, the rest show a summary and an "Open the original" link)
