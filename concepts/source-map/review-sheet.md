# Source Map review sheet

Every item in the Source Map, in the same order as the tree. Generated from `data.js`. 81 items: 47 added in this draft, 34 from our notes.

**How to use it:** write on each **Decision** line: *keep*, *cut*, *move to …* (stage or branch), or a note. The items marked **Added in draft** need the closest look; the rest came from our notes, so just check they're in the right place. Each stage has a decision line too. When you're done, tell Claude to apply the review sheet, and it will update `data.js`.

<!-- review -->
## Review

**Reviewed by Ethan on 30 Oct 2026.** Every stage, item and case study below has his decision. Nothing was cut; a few items are marked *keep for now* or *possible cut* for the team to decide. His questions haven't been researched yet. [`review-plan.md`](review-plan.md) lists that research for whoever picks it up; answers go under each decision, marked *research, to verify*.

**Questions for every source and tool:**
- Is there an official API or MCP connection, or would we need to build one?
- With this many tools and sites, how much does the agent depend on reliable computer use? Connecting every source one by one is a lot of work, and whoever uses the tool will add sources later.

**Principles from the review:**
- Keep the analyst in the loop.
- Any official UN tool should be built into the tool we're making.
- For every stage, confirm with the analyst that our thinking is right, or change it.
<!-- /review -->

| Stage | Items | Added in draft |
|---|---|---|
| 1 · Set the scene | 21 | 11 |
| 2 · Watch what's arriving | 10 | 5 |
| 3 · Check the silence | 16 | 13 |
| 4 · Verify what comes in | 17 | 13 |
| 5 · Carry it up | 6 | 1 |
| Case studies | 11 | 4 |
| **Total** | **81** | **47** |

**Links to open by hand** (they blocked the automated check on 29 Oct): [CrisisWatch](https://www.crisisgroup.org/crisiswatch), [Security Council Report](https://www.securitycouncilreport.org), [UN Digital Library](https://digitallibrary.un.org), [Africa Check](https://africacheck.org).

---

## 1 · Set the scene

*What's going on here, and what does normal coverage look like?*

- Who acts: Person sets country, region and issue. The tool shows data and statistics first, then context.
- Where a person decides: The analyst picks the situation. The tool doesn't suggest one.
- **Stage decision:** Keep. "This was what was discussed in order to start the tool and I like this concept. Keep the analyst in the loop."
  - Open question for the crew: is anything else missing from what the analyst sets first? (Nothing to add yet.)

### Choose the situation

#### Country

Required input · 10/27 meeting notes

- What the analyst sets: Which country or countries the analyst is looking at. Required, and set first.
- Why it matters for silence: Decides which outlets, languages and data count as normal coverage.
- **Decision:** Keep.

#### Region

Required input · 10/27 meeting notes

- What the analyst sets: Where in the country, for example Northwest Cameroon. Required.
- Why it matters for silence: Silence is uneven inside a country: the capital can be loud while a region goes unheard.
- **Decision:** Keep.

#### Issue or crisis

Required input · 10/27 meeting notes

- What the analyst sets: What the analyst is working on, for example an active conflict or a protest. Required.
- Why it matters for silence: Decides which signals matter. A protest and a conflict go quiet in different ways.
- **Decision:** Keep.

### Data & statistics

#### ACLED

Source · Free · Registration · Kelly's visit notes

[acleddata.com](https://acleddata.com) · loaded on 29 Oct

- What it is: Armed Conflict Location & Event Data: coded political violence and protest events.
- On silence: Event counts over time show when a place goes quiet in the data.
- Can't see: Built mostly from news, which under-reports rural and local-language areas. GeoGuard found no category for farmer-herder clashes.
- **Decision:** Keep.

#### UCDP

Source · Free · Open · Kelly's visit notes

[ucdp.uu.se](https://ucdp.uu.se) · loaded on 29 Oct

- What it is: Uppsala Conflict Data Program: conflict and fatality data going back decades.
- On silence: A long baseline for comparing today's reporting with the past.
- Can't see: Same news-based blind spots as ACLED, including farmer-herder clashes.
- **Decision:** Keep.

#### GDELT

Source · Free · Open · Kelly's visit notes

[gdeltproject.org](https://www.gdeltproject.org) · loaded on 29 Oct

- What it is: Monitors world news in many languages and codes it into events.
- On silence: Shows when a place drops out of the news, not just when events stop.
- Can't see: Machine-coded and noisy. Only as wide as the news it reads.
- **Decision:** Keep.

#### HDX

Source · Free · Open · **Added in draft**

[data.humdata.org](https://data.humdata.org) · loaded on 29 Oct

- What it is: OCHA's Humanitarian Data Exchange: thousands of datasets in one place.
- On silence: Shows which data exists for a place, and which is missing or out of date.
- **Decision:** Keep.

### Country context

#### CrisisWatch

Source · Free · Open · **Added in draft**

[crisisgroup.org/crisiswatch](https://www.crisisgroup.org/crisiswatch) · **not confirmed, open by hand**

- What it is: Crisis Group's monthly tracker of conflict developments in dozens of countries.
- On silence: A running record of what's been happening, so a sudden lack of news has something to be compared against.
- **Decision:** Keep.
  - Ethan had to open this one by hand (it also blocked our automated link check). Will that become a problem for an agent?

#### ReliefWeb

Source · Free · Open · **Added in draft**

[reliefweb.int](https://reliefweb.int) · loaded on 29 Oct

- What it is: OCHA's site for humanitarian reports, maps and updates.
- On silence: Shows which agencies report from a place, and how often.
- **Decision:** Keep.

#### ACAPS

Source · Free · Open · Concept README

[acaps.org](https://www.acaps.org) · loaded on 29 Oct

- What it is: Independent humanitarian analysis for crisis countries.
- On silence: Marks missing indicators as an "information gap" instead of leaving them blank.
- **Decision:** Keep.

#### Security Council Report

Source · Free · Open · **Added in draft**

[securitycouncilreport.org](https://www.securitycouncilreport.org) · **not confirmed, open by hand**

- What it is: Independent monthly forecast and tracking of the Security Council's agenda.
- On silence: Shows which situations are on the Council's radar, and which aren't.
- **Decision:** Keep.

### Academic research

#### Google Scholar

Tool · Free · Open · **Added in draft**

[scholar.google.com](https://scholar.google.com) · loaded on 30 Oct

- What it is: Search engine for peer-reviewed papers, theses and books.
- On silence: What researchers have documented about a place over years, including patterns from before the current news cycle.
- Can't see: Slow: research comes out months or years after events. Mostly English, and mostly about places researchers can reach.
- **Decision:** Keep.

#### African Journals Online

Source · Freemium · Open · **Added in draft**

[ajol.info](https://www.ajol.info) · loaded on 30 Oct

- What it is: Peer-reviewed journals published in Africa, many of them open access.
- On silence: Regional scholars often write about places international outlets ignore.
- Can't see: Africa only. Coverage varies by journal.
- **Decision:** Keep.

#### JSTOR

Source · Freemium · Registration · **Added in draft**

[jstor.org](https://www.jstor.org) · loaded on 30 Oct

- What it is: Archive of academic journals and books going back decades.
- On silence: Historical patterns: how this kind of silence played out in a place before.
- Can't see: Full text usually needs a library subscription.
- **Decision:** Keep.
  - Ethan got in through The New School's account. How much can a free account read? Does the UN have access?

#### Dag Hammarskjöld Library

Source · Free · UN or partner only · **Added in draft**

[un.org/en/library](https://www.un.org/en/library) · loaded on 30 Oct

- What it is: The UN's library. Gives UN staff research help and access to academic databases.
- On silence: A way into paid academic sources from a UN machine, without a separate licence.
- Can't see: Which databases it covers is a question for Silva.
- **Decision:** Keep.

### Normal coverage

#### Media Cloud

Tool · Free · Registration · **Added in draft**

[mediacloud.org](https://www.mediacloud.org) · loaded on 29 Oct

- What it is: Open-source tool for searching and counting online news coverage over time.
- On silence: Shows how much a place is usually covered and by which outlets, so a drop stands out.
- Can't see: Strongest for online news. Thin for radio and local-language outlets.
- **Decision:** Keep.

#### Radio Garden

Tool · Free · Open · **Added in draft**

[radio.garden](https://radio.garden) · loaded on 29 Oct

- What it is: A globe of live radio stations you can listen to.
- On silence: Shows which local stations broadcast from a region: a rough sense of who could be heard, if anyone listened.
- Can't see: Only stations that stream online.
- **Decision:** Keep.
  - Does it keep a transcript? Can we look back through its archives? Depending on the scenario, would the LLM have to listen to radio all the time?

#### Media mix check

Practice · Free · Open · 10/27 meeting notes

No link

- What it is: Note which kinds of media are reporting: international, regional, local-language, institutional (within the UN).
- On silence: Two reports, both in English from the capital, is a different signal from two reports in the local language.
- **Decision:** Keep.

### UN archive

#### UN Digital Library

Source · Free · Open · 10/27 meeting notes

[digitallibrary.un.org](https://digitallibrary.un.org) · **not confirmed, open by hand**

- What it is: UN documents, resolutions, reports and speeches.
- On silence: Previous or similar cases: how often a place came up before, and what was said.
- **Decision:** Keep.

#### UN Peacemaker

Source · Free · Open · **Added in draft**

[peacemaker.un.org](https://peacemaker.un.org) · loaded on 29 Oct

- What it is: DPPA's database of peace agreements and mediation guidance.
- **Decision:** Keep.

#### Internal case records

Source · Free · UN or partner only · 10/27 meeting notes

No link

- What it is: Internal archives of previous and similar cases, held by DPPA and other offices.
- On silence: What the UN already knew about past silences in the same place, and when.
- **Decision:** Keep.

---

## 2 · Watch what's arriving

*What is being reported now, from whom, and in which languages?*

- Who acts: Tool.
- Where a person decides: The tool counts and compares against normal. It doesn't say what the numbers mean.
- **Stage decision:** Keep, but "what is it comparing normal against? What is normal? That needs to be more specific."

### News & media

#### BBC Monitoring

Source · Paid · Registration · **Added in draft**

[monitoring.bbc.co.uk](https://monitoring.bbc.co.uk) · loaded on 29 Oct

- What it is: Monitors and translates local broadcast, print and online media worldwide.
- On silence: Local-language media is often where an unheard place is heard first.
- **Decision:** Keep.

### Local & community voices

#### Colleagues on the ground

Practice · Free · UN or partner only · Kelly's visit notes

No link

- What it is: Field officers and local contacts, often over WhatsApp. Usually the first word that something is happening.
- On silence: When they go quiet too, that's a signal in itself.
- **Decision:** Keep.

#### Remesh

Tool · Paid · Registration · Kelly's visit notes

[remesh.ai](https://www.remesh.ai) · loaded on 29 Oct

- What it is: AI-assisted digital dialogues with large groups. DPPA already works with it.
- On silence: Anonymous, low-bandwidth and in local languages. It reaches people who don't post publicly, and shows where they won't talk: Kelly's "two layers of quiet."
- **Decision:** Keep.
  - Is there a UN discount?

#### U-Report

Tool · Free · Open · **Added in draft**

[u-report.org](https://www.u-report.org) · loaded on 29 Oct

- What it is: UNICEF's youth polling over SMS and messaging apps.
- On silence: Asks people directly, where little is published.
- Can't see: Only reaches people who have signed up in that country.
- **Decision:** Keep.
  - Could we make a custom deployment for the UN and for this tool?

#### Ushahidi

Tool · Freemium · Registration · **Added in draft**

[ushahidi.com](https://www.ushahidi.com) · loaded on 29 Oct

- What it is: Platform for crowdsourced crisis reports and maps.
- On silence: Collects reports from people, not outlets.
- **Decision:** Keep.
  - This feels more like a model for the end of the funnel: what the result could look like for the analyst so it's digestible.

#### KoBoToolbox

Tool · Free · Registration · **Added in draft**

[kobotoolbox.org](https://www.kobotoolbox.org) · loaded on 29 Oct

- What it is: Field survey and data collection tool used widely by humanitarian teams.
- On silence: Structured reports from places media doesn't reach.
- **Decision:** Keep.

### Social & messaging

#### TGStat

Tool · Freemium · Open · Ethan's visit notes

[tgstat.com](https://tgstat.com) · loaded on 29 Oct

- What it is: Catalog and statistics for public Telegram channels.
- On silence: Shows which channels cover a place and how active they are. A busy channel going quiet is a signal.
- Can't see: Some channels are red herrings (Kelly's notes).
- **Decision:** Not numbered in the review. Kept as is (from Ethan's visit notes).

#### Telegram API

Tool · Free · Registration · Ethan's visit notes

[core.telegram.org](https://core.telegram.org) · loaded on 29 Oct

- What it is: Telegram's official API for reading public channels.
- On silence: Lets a tool track how much each channel posts over time.
- **Decision:** Not numbered in the review. Kept as is (from Ethan's visit notes).

#### Junkipedia

Tool · Free · Registration · **Added in draft**

[junkipedia.org](https://www.junkipedia.org) · loaded on 29 Oct

- What it is: Monitors public posts across platforms, including Telegram, for researchers and journalists.
- On silence: One place to watch many platforms for the same region.
- **Decision:** Keep.
  - It needs registration. Does the UN already have access?

#### X advanced search

Tool · Free · Registration · 10/27 meeting notes

[x.com/search-advanced](https://x.com/search-advanced) · loaded on 29 Oct

- What it is: Search posts by place, language, date and account.
- On silence: Compare this month's volume with past months for the same terms.
- **Decision:** Keep.
  - Grok can read X directly. Is that a way in?

---

## 3 · Check the silence

*Is something changing that reporting doesn't show?*

- Who acts: Tool, then person.
- Where a person decides: The tool sorts silence into quiet, unheard, or silent but changing. A person decides what to do about it.
- **Stage decision:** Keep.

### Satellite & fire

#### NASA FIRMS

Tool · Free · Open · **Added in draft**

[firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov) · loaded on 29 Oct

- What it is: Near-real-time fire detections from satellites.
- On silence: New fires where no one is reporting can mean burned farmland or villages.
- Can't see: Can't tell a field burn from an attack. Clouds and small fires get missed.
- **Decision:** Keep.
  - It already has an API.

#### Copernicus Browser

Tool · Free · Registration · **Added in draft**

[browser.dataspace.copernicus.eu](https://browser.dataspace.copernicus.eu) · loaded on 29 Oct

- What it is: Free Sentinel satellite imagery with before-and-after comparison.
- On silence: Check whether a place looks different from last month.
- Can't see: 10 m resolution: fields and burn scars, not individual buildings.
- **Decision:** Keep.

#### UNOSAT

Source · Free · UN or partner only · **Added in draft**

[unosat.org](https://unosat.org) · loaded on 29 Oct

- What it is: The UN Satellite Centre (UNITAR), which analyses imagery for UN agencies.
- On silence: Can be asked to look where reporting has stopped.
- **Decision:** Keep.
  - Any official UN tool should be built into the tool we're making.

#### Planet

Source · Paid · Registration · **Added in draft**

[planet.com](https://www.planet.com) · loaded on 29 Oct

- What it is: Near-daily commercial satellite imagery at higher resolution.
- On silence: Fine enough to see damage to buildings.
- **Decision:** Keep ("seems awesome").
  - Could the UN set up a partnership?

### Internet & connectivity

#### IODA

Tool · Free · Open · Concept README

[ioda.inetintel.cc.gatech.edu](https://ioda.inetintel.cc.gatech.edu) · loaded on 29 Oct

- What it is: Detects internet outages by country and region.
- On silence: A region going offline explains silence, and is a warning sign itself.
- **Decision:** Keep.

#### Cloudflare Radar

Tool · Free · Open · **Added in draft**

[radar.cloudflare.com](https://radar.cloudflare.com) · loaded on 29 Oct

- What it is: Traffic and outage data from Cloudflare's network.
- On silence: A second check on outages, by country and network.
- **Decision:** Keep.

#### NetBlocks

Source · Free · Open · **Added in draft**

[netblocks.org](https://netblocks.org) · loaded on 29 Oct

- What it is: Reports internet disruptions and shutdowns.
- On silence: Often the first public report of a shutdown.
- **Decision:** Keep.

#### #KeepItOn

Source · Free · Open · Concept README

[accessnow.org/campaign/keepiton](https://www.accessnow.org/campaign/keepiton/) · loaded on 29 Oct

- What it is: Access Now's campaign and yearly dataset of government internet shutdowns.
- On silence: Shows which governments have cut access before.
- **Decision:** Keep.

### People on the move

#### IOM DTM

Source · Free · Open · **Added in draft**

[dtm.iom.int](https://dtm.iom.int) · loaded on 29 Oct

- What it is: IOM's Displacement Tracking Matrix: where people are moving, and why.
- On silence: People leaving a place no one is reporting on is a strong signal.
- **Decision:** Keep.

#### UNHCR data portal

Source · Free · Open · **Added in draft**

[data.unhcr.org](https://data.unhcr.org) · loaded on 29 Oct

- What it is: Refugee and displacement figures by situation.
- On silence: Arrivals elsewhere can show trouble at home.
- **Decision:** Keep.

#### IDMC

Source · Free · Open · **Added in draft**

[internal-displacement.org](https://www.internal-displacement.org) · loaded on 29 Oct

- What it is: Internal Displacement Monitoring Centre: global data on displacement within countries.
- On silence: Covers movement inside a country, which border data misses.
- **Decision:** Keep.

### Food & markets

#### WFP HungerMap LIVE

Tool · Free · Open · **Added in draft**

[hungermap.wfp.org](https://hungermap.wfp.org) · loaded on 29 Oct

- What it is: Near-real-time food security estimates by region.
- On silence: Food access can change where nothing is being reported.
- **Decision:** Keep.
  - A good, organized heat map, sectioned by type of crisis.

#### FEWS NET

Source · Free · Open · **Added in draft**

[fews.net](https://fews.net) · loaded on 29 Oct

- What it is: Famine early warning analysis and food price data.
- Can't see: Was offline for months in 2025 during US aid cuts. Check it's current. A dataset the UN doesn't own, going dark.
- **Decision:** Keep.

### Ships & flights

#### Global Fishing Watch

Tool · Free · Open · Concept README

[globalfishingwatch.org](https://globalfishingwatch.org) · loaded on 29 Oct

- What it is: Maps vessel activity from ship tracking data.
- On silence: Ships switching off their trackers ("going dark") show up as gaps.
- **Decision:** Keep.
  - It has an official API.

#### MarineTraffic

Tool · Freemium · Open · **Added in draft**

[marinetraffic.com](https://www.marinetraffic.com) · loaded on 29 Oct

- What it is: Live ship positions and port calls.
- **Decision:** Keep for now.
  - There may be better options already in the map.

#### ADS-B Exchange

Tool · Free · Open · **Added in draft**

[globe.adsbexchange.com](https://globe.adsbexchange.com) · loaded on 29 Oct

- What it is: Unfiltered live flight tracking.
- On silence: Flight activity that changes when nothing is being reported.
- **Decision:** Keep for now.
  - Lots of good data, but is there a better tool?

---

## 4 · Verify what comes in

*Is this piece of content what it claims to be? If it's false, why was it made?*

- Who acts: Both.
- Where a person decides: The tools gather evidence about a piece of content. The analyst decides whether it can be used.
- **Stage decision:** Keep.
  - For every stage, not just this one: confirm with the analyst that our thinking is right, or change it.

### Images & video

#### InVID-WeVerify

Tool · Free · Open · Kelly's visit notes

[weverify.eu/verification-plugin](https://weverify.eu/verification-plugin/) · loaded on 29 Oct

- What it is: Browser plugin that breaks video into keyframes, runs reverse searches and reads metadata.
- **Decision:** Keep.
  - Does verifying with it take a long time?

#### TinEye

Tool · Free · Open · **Added in draft**

[tineye.com](https://tineye.com) · loaded on 29 Oct

- What it is: Reverse image search: where else has this image appeared, and when first?
- **Decision:** Keep.
  - Lots of APIs we could use.

#### Google Lens

Tool · Free · Open · **Added in draft**

[lens.google](https://lens.google) · loaded on 29 Oct

- What it is: Reverse image search with Google's index.
- **Decision:** Keep for now. **Possible cut.**
  - Not sold on it: it seems made for consumers.

#### Yandex Images

Tool · Free · Open · **Added in draft**

[yandex.com/images](https://yandex.com/images/) · loaded on 29 Oct

- What it is: Reverse image search that often finds matches the others miss.
- **Decision:** Keep. **Possible cut.**
  - Other tools may already do this, and do it better.

### Place & time

#### SunCalc

Tool · Free · Open · **Added in draft**

[suncalc.org](https://www.suncalc.org) · loaded on 29 Oct

- What it is: Sun position for any place and time. Check shadows against the claimed time.
- **Decision:** Keep.
  - Very useful for comparing images to verify timing.

#### Overpass Turbo

Tool · Free · Open · **Added in draft**

[overpass-turbo.eu](https://overpass-turbo.eu) · loaded on 29 Oct

- What it is: Query OpenStreetMap for features, like a mosque next to a river, to geolocate an image.
- **Decision:** Keep.

#### Mapillary

Tool · Free · Open · **Added in draft**

[mapillary.com](https://www.mapillary.com) · loaded on 29 Oct

- What it is: Street-level imagery to match against footage.
- **Decision:** Keep.
  - It has official APIs.

### Provenance & capture

#### Content Credentials

Tool · Free · Open · **Added in draft**

[verify.contentauthenticity.org](https://verify.contentauthenticity.org) · loaded on 29 Oct

- What it is: Checks a file for C2PA provenance data: who made it, and how it was edited.
- Can't see: Most files carry no credentials yet.
- **Decision:** Possibly keep.
  - Great concept, but it isn't finished. Do we want tools that are still works in progress?

#### Wayback Machine

Tool · Free · Open · **Added in draft**

[web.archive.org](https://web.archive.org) · loaded on 29 Oct

- What it is: Archived copies of web pages over time.
- On silence: Shows what a page said before it changed or vanished.
- **Decision:** Keep.

#### archive.today

Tool · Free · Open · **Added in draft**

[archive.ph](https://archive.ph) · loaded on 29 Oct

- What it is: On-demand snapshots of web pages.
- **Decision:** Possibly keep.
  - Not sure why our project needs it.

#### Hunchly

Tool · Paid · Registration · **Added in draft**

[hunch.ly](https://www.hunch.ly) · loaded on 29 Oct

- What it is: Captures every page you visit during an investigation.
- **Decision:** Keep.
  - Something like this could let the analyst see the agent's breadcrumb trail while it works on a case.

### Fact-checks

#### Fact Check Explorer

Tool · Free · Open · **Added in draft**

[toolbox.google.com/factcheck/explorer](https://toolbox.google.com/factcheck/explorer) · loaded on 29 Oct

- What it is: Google's search across published fact-checks.
- **Decision:** Keep.

#### Africa Check

Source · Free · Open · **Added in draft**

[africacheck.org](https://africacheck.org) · **not confirmed, open by hand**

- What it is: Independent fact-checking organisation covering African countries.
- **Decision:** Keep.

### Toolkits & guides

#### Bellingcat toolkit

Source · Free · Open · Kelly's visit notes

[bellingcat.gitbook.io/toolkit](https://bellingcat.gitbook.io/toolkit) · loaded on 29 Oct

- What it is: Bellingcat's directory of investigation tools, with notes on what each is good for.
- **Decision:** Keep.
  - The toolkit has a Git repo. Are there similar repos for other open-source toolkits we could use? Added to the research.

#### Bellingcat how-tos

Source · Free · Open · 10/27 meeting notes

[bellingcat.com/category/resources/?fwp_categories=how-tos](https://www.bellingcat.com/category/resources/?fwp_categories=how-tos) · loaded on 29 Oct

- What it is: Step-by-step guides from Bellingcat investigators.
- **Decision:** Keep.

#### OSINT Framework

Source · Free · Open · 10/27 meeting notes

[osintframework.com](https://osintframework.com) · loaded on 29 Oct

- What it is: The general OSINT directory this map is modelled on.
- **Decision:** Keep.
  - This draft is based on it.

#### Verification Handbook

Source · Free · Open · **Added in draft**

[datajournalism.com/read/handbook/verification-3](https://datajournalism.com/read/handbook/verification-3) · loaded on 29 Oct

- What it is: Guide for journalists and humanitarians on verifying digital content.
- **Decision:** Keep, if we can publish its text in our prototype.

---

## 5 · Carry it up

*How does what we don't know travel with the analysis to the envoy?*

- Who acts: Person.
- Where a person decides: The analyst asks someone closer, acts anyway, or records "unknown," and says why.
- **Stage decision:** No separate response. Ethan's note on stage 4 covers every stage.

### Record the gap

#### Gap record

Practice · Free · Open · Concept README

[../quiet-or-unheard/index.html](../quiet-or-unheard/index.html) · not checked

- What it is: What the analysis rests on, where it's silent, what disagrees, and who could fill the gap.
- On silence: Travels with the analysis to the envoy. People can add to it, not quietly delete it.
- **Decision:** Keep.

#### ACAPS gap method

Source · Free · Open · Concept README

[acaps.org/fileadmin/Technical_notes/20211207_acaps_humani…](https://www.acaps.org/fileadmin/Technical_notes/20211207_acaps_humanitarian_access_methodology_note_december_2021.pdf) · loaded on 29 Oct

- What it is: ACAPS's method note: missing indicators are marked "information gap", not left blank.
- **Decision:** Keep.

#### Berkeley Protocol

Source · Free · Open · **Added in draft**

[ohchr.org/en/publications/policy-and-methodological-publi…](https://www.ohchr.org/en/publications/policy-and-methodological-publications/berkeley-protocol-digital-open-source) · loaded on 29 Oct

- What it is: OHCHR and UC Berkeley's standard for digital open-source investigations.
- On silence: A shared way to document how evidence was found, and what couldn't be found.
- **Decision:** Keep.

### Check with people

#### Ask someone closer

Practice · Free · UN or partner only · Concept README

No link

- What it is: Before deciding, ask someone closer to the place. Their answer goes in the gap record.
- **Decision:** Keep.

#### Regional member states

Practice · Free · UN or partner only · Kelly's visit notes

No link

- What it is: Check with member states in the region, and watch what influential members are saying.
- **Decision:** Keep.

### Learn afterwards

#### After-action check

Practice · Free · Open · Concept README

No link

- What it is: Afterwards, check whether the silence hid something, and update what normal coverage looks like.
- **Decision:** Keep.
  - It will also help with documentation for the archives.

---

## Case studies

*Where has silence been read as a signal before?*

- Who acts: Research (Ethan, Ani).
- Where a person decides: Each case is linked to the stage it illustrates.
- **Stage decision:** Keep all. Ethan will read them properly in his own time.

### Silence read as a signal

#### Zero reporting, Malawi

Case study · illustrates stage 2 (Watch what's arriving) · Concept README

[pmc.ncbi.nlm.nih.gov/articles/PMC6264833](https://pmc.ncbi.nlm.nih.gov/articles/PMC6264833/) · loaded on 29 Oct

- What went silent: Clinics with no cases to report.
- What revealed it: Clinics must send a "no cases" report, so silence is never mistaken for health.
- **Decision:** Keep.

#### GeoGuard's missing category

Case study · illustrates stage 2 (Watch what's arriving) · Concept README

[mptf.undp.org/sites/default/files/documents/2026-03/2024_…](https://mptf.undp.org/sites/default/files/documents/2026-03/2024_dppa_geoguard_finalreport_narrative_0.pdf) · loaded on 29 Oct

- What went silent: Farmer-herder clashes.
- What revealed it: GeoGuard's conflict data (ACLED and UCDP) had no category for them, so they never appeared on the map.
- **Decision:** Keep.

#### Ships going dark

Case study · illustrates stage 3 (Check the silence) · Concept README

[civilbeat.org/2022/12/when-fishing-boats-go-dark-at-sea-t…](https://www.civilbeat.org/2022/12/when-fishing-boats-go-dark-at-sea-theyre-often-committing-crimes-heres-where-its-happening/) · loaded on 29 Oct

- What went silent: Fishing vessels that switched off their trackers.
- What revealed it: Gaps in tracking data hid about 6% of global fishing activity.
- **Decision:** Keep.

#### Shutdown monitors

Case study · illustrates stage 3 (Check the silence) · Concept README

[blog.apnic.net/2024/09/11/ioda-internet-outage-detection-…](https://blog.apnic.net/2024/09/11/ioda-internet-outage-detection-and-analysis/) · loaded on 29 Oct

- What went silent: Whole regions going offline.
- What revealed it: IODA and #KeepItOn treat a region going silent as a warning sign.
- **Decision:** Keep.

#### El Fasher, 2025

Case study · illustrates stage 3 (Check the silence) · Concept README

[newarab.com/news/new-satellite-images-suggest-mass-killin…](https://www.newarab.com/news/new-satellite-images-suggest-mass-killings-persist-sudans-el-fasher) · loaded on 29 Oct

- What went silent: Reporting from the city, under a communications blackout.
- What revealed it: Satellite imagery documented what reporting couldn't.
- **Decision:** Keep.

#### The pharmacy run

Case study · illustrates stage 3 (Check the silence) · Kelly's visit notes

No link

- What went silent: Nothing in the news.
- What revealed it: Field colleagues noticed foreign soldiers asking for pharmacies, stocking up before fighting. Told to us at the UN.
- **Decision:** Keep.

#### ACAPS information gaps

Case study · illustrates stage 5 (Carry it up) · Concept README

[acaps.org/fileadmin/Technical_notes/20211207_acaps_humani…](https://www.acaps.org/fileadmin/Technical_notes/20211207_acaps_humanitarian_access_methodology_note_december_2021.pdf) · loaded on 29 Oct

- What went silent: Indicators with no data.
- What revealed it: ACAPS marks them "information gap" instead of leaving them blank.
- **Decision:** Keep.

### To research

#### Tigray, 2020

Case study · illustrates stage 3 (Check the silence) · **to research** · **Added in draft**

No link

- What went silent: Communications blackout during the war.
- What revealed it: What filled the gap, and what was missed?
- **Decision:** Keep.

#### Myanmar, 2021

Case study · illustrates stage 3 (Check the silence) · **to research** · **Added in draft**

No link

- What went silent: Internet shutdowns after the coup.
- What revealed it: How did outage monitors and diaspora networks fill in?
- **Decision:** Keep.

#### Rakhine, 2017

Case study · illustrates stage 3 (Check the silence) · **to research** · **Added in draft**

No link

- What went silent: Access to northern Rakhine State.
- What revealed it: Satellite imagery showed burned villages. How did it move into UN analysis?
- **Decision:** Keep.

#### Anglophone Cameroon

Case study · illustrates stage 2 (Watch what's arriving) · **to research** · **Added in draft**

No link

- What went silent: Our map scenario.
- What revealed it: How is the crisis covered in local languages and on community radio?
- **Decision:**
