# Source Map

**Draft by Ethan, for team discussion.** Covers tasks 2 and 3 from the 10/27 meeting:
- **Task 2:** gather sources and OSINT tools, plus case studies (Ethan, Ani).
- **Task 3:** expand and firm up the funnel flow (Ethan, Kelly).

Open [`index.html`](index.html) in a browser. It's a collapsible tree in the style of [OSINT Framework](https://osintframework.com/), built around our question: how might UN analysts tell a quiet place from an unheard one?

**Reviewed by Ethan on 30 Oct.** His decision on every stage, item and case study is in [`review-sheet.md`](review-sheet.md). The research and edits that follow from it are listed, not yet started, in [`review-plan.md`](review-plan.md).

## The output

The tree's first level is the funnel and the branches underneath it are the sources. Read left to right, it's the path an analyst takes:

| Stage | Question the analyst asks | Who acts |
|---|---|---|
| 1 · Set the scene | What's going on here, and what does normal coverage look like? | Person sets country, region and issue (all required); tool shows data and statistics first, then context |
| 2 · Watch what's arriving | What is being reported now, from whom, in which languages? | Tool |
| 3 · Check the silence | Is something changing that reporting doesn't show? | Tool, then person |
| 4 · Verify what comes in | Is this piece of content what it claims to be? | Both |
| 5 · Carry it up | How does what we don't know travel with the analysis? | Person |

A separate branch holds **case studies**: places where silence was read as a signal elsewhere. Each one is linked to the stage it illustrates.

These stages fold the Quiet or Unheard? flow (Find the gap → Check the silence → Carry it up) together with the launch flow from the meeting notes (mandatory country/region/issue → filtered side panel → confirm the situation).

**Each item carries:**
- what it is and what it can tell you about silence
- cost (free, freemium, paid) and access (open, registration, UN or partner only), which the meeting notes asked for
- where it came from: our UN visit notes, the meeting notes, the concept README, or added for this draft
- whether its link has been checked

**Interface:**
- **Search** works like OSINT Framework's.
- **Filters** are a light version of the "shopping site" side panel from the meeting notes.
- **The Notes panel** explains the tags.
- **A trail** at the top shows where you are, with a back button. On a phone, opening a branch pushes its parents off screen, so the trail is how you find your way back.

**Left out on purpose:** people search, usernames, emails and phone numbers. Our question is about places, not individuals. A source map that can find people is a surveillance tool.

## Research plan

### Questions

- **Task 2:** For our two mock scenarios, where would an analyst look? Which of those places can say anything about silence: what isn't being reported, and whether something is changing anyway? What does each one cost, and who can get in?
- **Task 2, case studies:** Where else has silence been treated as a signal, and what revealed it?
- **Task 3:** In what order does an analyst move through these sources? Where does a person make the call, not the tool? Where would a filter keep the analyst from being overwhelmed?

### Scope

- **Narrow first, then generalize** (from the meeting notes). We start with Northwest Cameroon, the region in the existing map concept, and the two mock scenarios Ani, Daisy and Arav are writing: an active conflict in a decentralized region, and a protest.
- **Place-level signals only.** No tools for finding or profiling people.
- **Public or UN-accessible sources only.** We have to be able to link to it or name the UN office that holds it.

### Task 2: sources

1. **Start from what we have.** The seed list is already in the draft: Kelly's and Ethan's trip notes, the 10/27 meeting notes, the case studies in the [Quiet or Unheard? README](../quiet-or-unheard/README.md), Bellingcat's [how-tos](https://www.bellingcat.com/category/resources/?fwp_categories=how-tos) and [toolkit](https://bellingcat.gitbook.io/toolkit), and OSINT Framework's Disinformation & Media Verification branch.
2. **Keep a source only if** it helps on at least one stage for our scenarios, and we can say what it can't see (languages, rural coverage, update lag).
3. **Record it in [`data.js`](data.js)** using the fields in "Each item carries" above. Optional `limits` field for known blind spots.
4. **Check every link,** and recheck before the play test. On 29 Oct, 57 of 61 links loaded. Four sites blocked the automated check and need opening by hand: Africa Check, CrisisWatch, Security Council Report and the UN Digital Library. The four academic links added on 30 Oct all loaded.
5. **Mark anything we're unsure of.** For example, whether the UN has a license for a paid tool, or whether OICT allows it on UN machines. Those become questions for Silva, not guesses.

### Task 2: case studies

For each case, write down:
- what went silent
- what signal revealed it, or would have
- what was decided or missed
- which stage it illustrates
- a source link

The six cases in the concept README are already in the tree. Candidates to research are marked "to research" there: Tigray 2020, Myanmar 2021, Rohingya 2017, and Anglophone Cameroon.

### Task 3: funnel

1. **Kelly and Ethan agree on the five stages,** or change them. Then check them against Silva's workflow from the UN visit: news first, then colleagues on the ground and local communities, then corroboration online, then OSINT if a place goes dark.
2. **Walk both mock scenarios through the tree.** For each stage, note which branches the analyst opens, what they decide, and what they'd skip.
3. **Mark every decision point.** The tool shows; a person decides. If a stage needs a verdict from the tool, the stage is wrong.
4. **Test the filter idea:** does filtering by cost, access and source type cut the tree down to something an analyst can use in one sitting?

### Questions for Silva

1. When you start on a new situation, what do you set first? How long does it take to feel you understand it?
2. Which of these sources do you already use, and which aren't allowed on UN machines?
3. Which paid tools does the UN license, and which UN-only sources are missing (UNOSAT, internal archives)?
4. Where in this path do you make the call, and where would you want a tool to stay out?
5. If the map marked a source as "can't see this region," would you trust it more or less?

### Schedule to the Nov 5 play test

| Day | What | Who |
|---|---|---|
| Thu 10/29 | Draft tree and this plan | Ethan |
| Fri 10/30 | Share draft. Ani reviews sources and takes the case-study candidates. Kelly reviews the stages | Ethan, Ani, Kelly |
| Mon 11/2 | Merge Ani's sources and the mock scenarios. Recheck links | Ethan, Ani |
| Wed 11/4, 4–6 PM | Team walks both scenarios through the tree and picks what to play test | Everyone |
| Thu 11/5 | Play test | Everyone |

### Risks

- **Overwhelm.** A directory of every tool is the problem we heard at the UN, not the answer. The stages and filters have to do real work.
- **Going stale.** Links die and tools close. Each item needs a check date, and someone has to own rechecks.
- **The map has gaps too.** Coverage is weakest for local languages and community radio, which is exactly where "unheard" lives. We should say so in the tree.
- **Tools the UN can't use.** OICT is wary of what goes in. A great tool the analyst can't open is a dead branch.

---

A student concept for the AI + Information Futures Studio (The New School, Fall 2026). Not a UN tool, product or position.
