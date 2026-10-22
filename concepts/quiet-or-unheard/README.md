# Quiet or Unheard?

**Concept draft by Ethan, for team discussion. Not a finished design.**
Territories 5 (Data + Ground Truth), 7 (Human Judgment) and 10 (Building for Peace) · thread: Judgment · for: UN analysts

Open [`index.html`](index.html) in a browser for the interactive version: a scenario map and a flow you can hover or tap through.

## Our question

How might we help UN analysts tell a **quiet** place from an **unheard** one, so early warning rests on an honest picture of what is and isn't known?

## The concept: silence as a data point

Most tools work with the data you already have. This one measures the data you don't. It compares the reporting a place normally gets with what is arriving now, checks any silence against independent signals, and keeps that gap attached to the analysis all the way up to the envoy.

It never scores trust or gives a verdict. A person makes the call. This follows the DPPA Innovation Cell's own practice of not embedding analysis in their tools.

## Scenario (illustrative, numbers made up)

A district in Cameroon's Northwest normally produces about 15 reports a month, including local-language community radio. This month there are 2, both in English, both from outlets in the capital. Satellite imagery shows newly burned farmland. On a conflict map, few reports reads as calm. Is the district quiet, or is no one hearing it?

## How it would work

Find the gap → Check the silence → Carry it up. This is our proposed flow, not a UN process.

| Phase | Step | What happens | Who |
|---|---|---|---|
| 1 · Find the gap | 1 Expect | Learn what normal coverage looks like for each place: how many reports, from which sources, in which languages | Both |
| | 2 Observe | Track what is actually arriving now | Tool |
| | 3 Compare | Normal minus now is the gap, including kinds of events the data can't capture | Tool |
| 2 · Check the silence | 4 Test | Test the silence against independent signals: satellite change, internet outages, displacement, market prices, ground sensors. Sort it as quiet, unheard, or silent but changing | Tool |
| | 5 Show | Put the gap beside the analysis: what it rests on, where it's silent, what disagrees, who could fill the gap | Both |
| 3 · Carry it up | 6 Decide | The analyst asks someone closer, acts anyway, or records "unknown," and notes why | Person |
| | 7 Carry | The gap record travels with the analysis to the envoy. People can add to it, but not quietly delete it | Person |
| | 8 Learn | Afterwards, check whether the silence hid something and update what normal coverage looks like | Both |

It maps onto DPPA's own "where credibility breaks" chain: inputs (field adviser) → language → analysis (desk officer) → outputs (envoy).

## Why this could work

**From our research and the UN**

- DPPA's tools avoid "embedding analysis"; the user adds the judgment (Innovation Cell, studio launch, Oct. 2).
- GeoGuard's conflict data (ACLED and UCDP) had no category for farmer-herder clashes, so they were invisible on the map ([GeoGuard final report](https://mptf.undp.org/sites/default/files/documents/2026-03/2024_dppa_geoguard_finalreport_narrative_0.pdf)).
- Conflict event data comes mostly from news, which under-reports rural and local-language areas ([ACLED on reporting sources](https://acleddata.com/2015/04/22/a-new-working-paper-on-acled-reporting-sources), [roadside bias study](https://minds.wisc.edu/items/5365455d-0523-4a5d-84d7-d5e787c38dd0)).
- Early warning tends to fail between warning and action, not at prediction ([IDS](https://www.ids.ac.uk/publications/conflict-early-warning-and-early-response)).
- Prediction from historical data alone is insufficient, and foresight should ask "whose vision of the future" it serves ([MinJi Song, Futuring Peace, 2021](https://medium.com/futuring-peace/what-if-uncertainty-is-the-path-to-peace-29cfc5cd03d4)).

**Already done in other fields**

- **Zero reporting** in disease surveillance: clinics report "no cases," so silence is never mistaken for health ([Malawi IDSR study](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6264833/)).
- **Ships "going dark"**: switched-off trackers hid about 6% of global fishing activity ([The Conversation via Civil Beat](https://www.civilbeat.org/2022/12/when-fishing-boats-go-dark-at-sea-theyre-often-committing-crimes-heres-where-its-happening/)).
- **Internet shutdown monitors** (IODA, #KeepItOn) treat a region going silent as a warning sign ([APNIC on IODA](https://blog.apnic.net/2024/09/11/ioda-internet-outage-detection-and-analysis/), [#KeepItOn 2023](https://pulse.internetsociety.org/en/news/internet-shutdowns-in-2023-the-keepiton-report/)).
- **El Fasher, 2025**: under a communications blackout, satellite imagery documented what reporting couldn't ([The New Arab](https://www.newarab.com/news/new-satellite-images-suggest-mass-killings-persist-sudans-el-fasher)).
- **ACAPS** marks missing indicators as "information gap" instead of leaving them blank ([methodology](https://www.acaps.org/fileadmin/Technical_notes/20211207_acaps_humanitarian_access_methodology_note_december_2021.pdf)).

**What looks new:** applying this to the datasets behind UN political analysis and early warning, and carrying the gap up the chain to the envoy. We haven't found anyone doing that, which is a question for the practitioners.

## Risks to design for

- **Baseline:** a gap only means something against normal coverage, and deciding what is "normal" is itself a judgment.
- **A gap is a prompt, not evidence.** It points to where to look, not what happened.
- **The gap detector has gaps too.** The tool must say what it can't see.
- **Surveillance:** a map of where the UN can't see could become a target map. Who gets to see it?

## Questions for UN practitioners (draft)

1. When a dataset or early-warning map shows nothing for a district, how do you tell "quiet" from "unreported"?
2. Does anyone at DPPA track where your data goes quiet?
3. Which datasets do you depend on that the UN doesn't own, and what happened when one changed or went dark?
4. Is this how a claim moves from the field to an envoy, and where does what you didn't know get lost?
5. If a tool marked a place as unheard, who should see that, and who could contest it?

## Open questions for the team

1. What counts as "normal" coverage for a place, and who decides?
2. Which independent signals could DPPA realistically use?
3. How do we explain the difference from concepts that flag what AI loses when summarizing voices it collected? We track what was never collected.
4. Who should be allowed to see the gap map?
5. Does this fit into GeoGuard or the briefing workflow, or is it a new tool?
6. Which part do we prototype first for the Nov. 5 play test?

---

A student concept for the AI + Information Futures Studio (The New School, Fall 2026). Not a UN tool, product or position.
