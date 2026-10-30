# After the review

Ethan reviewed the whole Source Map on 30 Oct 2026. His decision on every stage, item and case study is in [`review-sheet.md`](review-sheet.md). He kept everything and asked questions. This plan covers the research and edits those questions call for, done in one pass.

## 1. How the agent connects to each source

Ethan asked this of every source and tool: is there an official API or MCP connection, or would we need to build one?

For each item that has a link, find out the following. Skip required inputs, practices without a link, and case studies.
- **API:** is there an official one? Link the docs, say what it takes to use (nothing, a free key, registration, payment, a partner agreement), and note any important limits.
- **MCP server:** official, community-built, or none. For a community one, give the link, the maintainer and the date of its last update.
- **Automated access:** do the terms allow it, or only through the API? Does the site block automated browsers? CrisisWatch did.
- **Best route for the agent:** one of these:
  - API or MCP
  - a feed or bulk download (RSS, HDX, exports)
  - browser only (computer use)
  - people (practices, colleagues)

Then make it visible:
- Record it in `data.js` as one new field per item. Follow the file's existing style and document the field in its header comment.
- Show it in the detail panel as "How the agent connects".
- Add it to the output of `tools/make-review-sheet.js`.
- If it stays light, add a "Connects by" filter next to cost and access.

## 2. API or MCP, or computer use?

Ethan asked: "With lots of these tools and sites, wouldn't having flawless computer use for the agent be extremely important? Having to reconnect all of these sources will be a pain, and that's not including the sources and tools that get added in the future by whoever is using this tool."

Answer it in `connection-strategy.md`, a page or two, using what step 1 found. Cover:
- how many sources fall under each route
- how much a few aggregators already cover, such as HDX and the ReliefWeb API
- what computer use does well and badly today for this job: speed, reliability, sites that block automated browsers, terms of use, cost
- what OICT is likely to accept on UN machines
- how a user would add a new source later, under each approach
- whether a recorded browser trail could be the agent "breadcrumb trail" Ethan wants (see Hunchly, stage 4)

End with a recommendation and what we would need to test. Don't recommend anything that gets around CAPTCHAs or bot blocking.

## 3. Questions on specific items

| Item | Stage | Question |
|---|---|---|
| CrisisWatch | 1 | Ethan had to open it by hand, and it blocks automated checks. Will that be a problem for an agent? Is there another way in, such as a feed? |
| JSTOR | 1 | How much can a free account read? Does the UN have a subscription, for example through the Dag Hammarskjöld Library? |
| Radio Garden | 1 | Does it keep transcripts or archives? If not, what would? Is there existing radio monitoring to learn from, such as UN Global Pulse's radio work in Uganda? Would the agent have to listen all the time? |
| Remesh | 2 | Is there a UN or nonprofit discount? How does DPPA already use it? |
| U-Report | 2 | Could there be a custom deployment for the UN and this tool? |
| Ushahidi | 2 | What does its analyst-facing view look like? Ethan sees it as a model for the end of the funnel. |
| Junkipedia | 2 | Does the UN already have access? |
| X advanced search | 2 | What does the X API cost now? Can Grok or xAI search X through an API, and on what terms? |
| UNOSAT | 3 | What can a tool reach programmatically, and how would we build it in? Ethan: any official UN tool should be built in. |
| Planet | 3 | Is there a UN partnership or program we could use? |
| MarineTraffic, ADS-B Exchange | 3 | Are there better options, including ones already in the map? |
| InVID-WeVerify | 4 | How long does verifying with it take in practice? |
| TinEye | 4 | What do its APIs do and cost? |
| Google Lens, Yandex Images | 4 | Possible cuts. Is there an API? Do other tools in the map do the job better? Give the team a recommendation. |
| Content Credentials | 4 | How finished and how widely adopted is it now? Do we want tools that are still in progress? |
| archive.today | 4 | What does it add beyond the Wayback Machine? Make the case for it, or recommend cutting it. |
| Hunchly | 4 | Could it, or something like it, show the agent's breadcrumb trail on a case? |
| Bellingcat toolkit | 4 | Its toolkit is a GitHub repo. Which other open-source toolkits have repos we could use? |
| Verification Handbook | 4 | What is its license? Can we publish its text in our prototype? |

**Stage 2, "what is normal?"** Ethan asked what stage 2 compares against: "normal" needs to be more specific. Find how monitoring tools set a baseline, for example IODA for outages, Media Cloud for news volume, and ACLED for event trends. Then write a specific definition:
- what is counted (for example, reports by source type and language for the chosen place)
- what it is compared against (for example, the same place's own past weeks, from stage 1's Normal coverage branch)
- what counts as a drop

Put it into stage 2's text in `data.js` and the README table, marked as a draft for Kelly and Ethan.

## 4. Other edits

- **Show the items under review in the tree**, so the team sees them at the Nov 4 walkthrough. For example, use a small tag:
  - possible cuts: Google Lens, Yandex Images
  - keep for now: MarineTraffic, ADS-B Exchange
  - possibly keep: Content Credentials, archive.today
- **README:**
  - Add the review status and the principles from the review: keep the analyst in the loop, build in official UN tools, confirm each stage with the analyst. Add Ethan's two design ideas: an Ushahidi-style view at the end of the funnel, and the agent's breadcrumb trail.
  - Add to "Questions for Silva":
    - Does the UN have access to JSTOR and Junkipedia, a Remesh discount, or a Planet partnership?
    - May an agent use computer use on UN machines?
    - Can we walk through each stage with him to confirm it?
  - List the open-source toolkit repos found in step 3 as candidates under Task 2. Don't add them to the tree until the team reviews them.
  - Link `review-sheet.md`, this plan and `connection-strategy.md`.
- **Review sheet:**
  - Put each answer under the item's Decision line as an indented bullet starting *Research, to verify:*, with a source link.
  - Keep those bullets directly under the Decision, with no blank line in between, so `tools/make-review-sheet.js` keeps them when the sheet is rebuilt.
  - After changing `data.js`, rebuild the sheet with that script instead of editing it by hand.
  - Update the review block at the top to say the research is done.

## Rules

- Don't cut, move or rename items. Those decisions belong to the team.
- Cite a source and the date checked for every claim about an API, a price or access. Write "couldn't confirm" rather than guess.
- Place-level sources only. No people-search tools (see "Left out on purpose" in the README).
- Write in plain language, matching the existing text.

## Not in this pass

- Side-panel categories: Ethan deferred them.
- Case studies: Ethan is reading them himself, and the "to research" cases are Ani's.
- Full link recheck: scheduled for Mon 11/2, before the play test.

## Done when

- Every linked item has its connection field, with a source.
- `connection-strategy.md` answers Ethan's question with a recommendation.
- Every question in step 3 has an answer, or "couldn't confirm", in the review sheet.
- The map loads without console errors, and the sheet rebuilds without losing decisions.
- The changes are pushed to this pull request's branch.
