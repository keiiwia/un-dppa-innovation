# UN Trip Notes

## Focus and framing

- Hone in on the specific user: a Member State, a desk officer, or someone advising a decision-maker?
- Consider the social dynamics and systems already in place.
- Is this a conversation the UN should have with the private sector?
- Are we addressing two challenges at once?
  1. Verification and credibility
  2. Lack of information
- A lot of information and world events remain buried.

## Current information and verification systems

Consider the current technology and human procedures.

### Technology

- What platforms and tools are being used to verify and receive information?
- Information is gathered from traditional media (including WSP), local-language sources, regional sources, UN institutions, academic sources (peer-reviewed), and OSINT (including satellite imagery).
- Open-source data is a potential input.
- When sources go dark, connect to whichever tools are being used and understand what is migrating.
- Satellite information is a key dependency.
- Be mindful of deviations from usual trends.
- There is a large body of human knowledge about on-the-ground conditions.

### People and procedures

- Who is sending information?
- Some offices are dedicated to monitoring media and news around the clock.
- Verification is currently done by people, and it is unclear whether that will change.
- OICT, within the UN, provides tools and recommendations/guidelines. There is extreme skepticism and wariness about the information that is input or gathered.
- Joint officers centers consider gathered intelligence and information and make sense of it in context. They are struggling to process the amount of information they receive.
- There are different levels of communication:
  1. Public: a spokesperson tweets a public service announcement.
  2. Discreet: a leader calls a president to communicate what is happening.
- Reports are reviewed manually to assess where information is corroborated, including checks with regional Member States and prolific or influential voices.

## AI, policy, and governance

- There is a lot of discussion about AI within the UN, but trying to change things drastically may be unreasonable.
- Restrictions on communication and AI are increasing:
  - No AI-generated images.
  - No images to be taken.
  - No music made with AI.
  - Abstract backgrounds may be used with a disclaimer/attribution.
- General principle: use a disclaimer where it helps the work, but a disclaimer does not determine anything.
- Microsoft Copilot in Teams can be fine-tuned for a team or organization.
- For court liability, Claude may be used with public documents, but nothing sensitive.
- Questions to resolve:
  - What is public versus private?
  - Which tools, products, and projects are UN products?
  - What is considered a UN product?
  - How do web-compliance requirements such as WCAG apply?
  - How can teams minimize their roles in specific projects while retaining ownership?
- Who watches the watcher? Oversight is bureaucratic, but is generally considered good and trustworthy.
- What is the problem-solving procedure?

## Potential information-analysis workflow

The goal is to create an architecture with layers, guardrails, and verifiable platforms that gather concrete intelligence reports, pass information between tools, and corroborate it with officers in the field.

1. Gather information from traditional media, local-language sources, regional sources, UN institutions, academic research, OSINT, satellite imagery, videos, images, and colleagues on the ground.
2. Examine who supports or funds the sources—not to determine who is right or wrong, but to understand provenance.
3. Corroborate reports with satellite imagery and colleagues on the ground.
4. Surface the available evidence for human analysis rather than having AI make the analysis.
5. Trigger checks when information appears to have been manipulated.

Additional notes:

- AI training should not be framed as determining right and wrong; it should surface the full range of information provided by each team.
- One workflow being tested for protests double-checks information against AACA, UCDP, and satellite images.
- The approach has been used for conflict, maritime issues, and protests.
- inVID was tested as a tool, but it was new at the time.
- Provenance and where information circulates from may be checked automatically.
- There is an abundance of verifiable data.
- A tool built with OpenAI is in a GitHub repository and has been tweaked to reduce hallucinated generation.
- The first signals may come from news, colleagues on the ground reporting what is happening and where, or local communities. Online research follows from there.
- Example: a reported uptick in foreign soldiers asking pharmacies to stock up on medicine could be a sign they were preparing for war.
- The seriousness of a situation depends greatly on citizens' perspectives. What they report needs corroboration, and understanding requires being well connected to local sources.

## Signals, misinformation, and context

- Political leaders may repeat misinformation based on other misinformation. How do we make sense of this?
- Look at which outlets are backing a story and who is funding whom, alongside corroboration and satellite imagery.
- Telegram channels and rooms can help gather signals, but some signals may be red herrings.
- GDELT Project: consider different levels of communication.
- Compare preemptive signs with post-event signs.
- Assess understanding of local subcontexts, potentially case by case and through pattern recognition.
- Consider "moments of silence" as a possible signal.
- In what scenarios are we seeing AI-generated content? It is typically associated with foreign interference and propaganda.
- The question may not be whether a piece of content is true. If a video is known to be false, ask why it was created in the first place.
- Analytics and Bellingcat can help analyze information already gathered:
  - [Bellingcat](https://www.bellingcat.com/)
  - Bellingcat Verification Toolkit
- A lot of information is available, but the challenge is making sense of it all in a way that supports political work.

## Local knowledge and public engagement

- There is a persistent feeling that there is not enough information from the ground, and that less on-the-ground information is becoming available.
- New signals are being gathered through different platforms.
- Remesh is a consultation tool for AI-powered digital dialogues. It can help understand grievances in a specific area.
  - IP addresses are not tracked.
  - Anonymity can provide safety.
  - The tool is designed for low bandwidth.
  - Local languages are still needed.
  - Conversations may be multi-level or bilateral, with complete anonymity.
  - Use specific, leading questions about where respondents are coming from to gather concrete information without flattening the statistics.
  - The machine-learning component shows points of convergence and divergence.
- Humility is essential. Subcontexts and subcultures matter greatly in how we communicate with people.
- People may not feel comfortable discussing some topics, regardless of anonymity. There are two layers of quiet:
  1. Unwillingness to respond.
  2. How people respond to one another once they open up.
- Create space for people to relate and open up before asking difficult questions.
- A complete lack of control makes it difficult to understand subcontexts and identify root problems.

## Organizational and cultural context

- Teams and cells are siloed, making it hard to connect, understand roles, and clarify ownership across an organization of more than 40,000 people.
- UN-alike templating may help.
- Greater inspiration from the arts and the surrounding environment could help preserve the cultures and subcontexts of UN partners, rather than moving further toward corporatism.
- Keep the motivation of maintaining peace in view.
- DPPA is described as the spine of the UN because of its focus on diplomacy.

## Open questions and proposed resource

- What is the biggest focus in the field of global issues?
- How can analysts sustainably process large volumes of information while keeping human analysis central?
- How much of the local subcontext do we understand?
- How can decentralized platforms (including Telegram, Instagram, and YouTube), verification tools (including Bellingcat), and political work be connected in a coherent way?
- Which tools do journalists use, and which tools are useful for which use cases?

### Proposed directory

Create a directory that:

- Gathers information from journalists about what actually works for different use cases.
- Explains how to navigate and use each tool quickly.
- Clarifies the next human steps in the workflow.
- Shows how to bring corroboration into the architecture and which tool to use at each stage.
