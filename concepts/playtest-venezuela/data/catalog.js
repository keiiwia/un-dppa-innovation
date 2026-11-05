// Mock database for the playtest: stands in for what a web scraper would return.
// Scenario: the US capture of Nicolás Maduro, Jan 3–16, 2026.
//
// added     team (from the team's list) | research (found while building this)
// read      how this entry's text was obtained, shown to the analyst:
//           direct = page opened and read | search = only search-result text, the page itself would not open
//           none = could not be read at all, so the summary says only what the link or title shows
// published YYYY-MM-DD, or null when no date could be confirmed (dateNote says why)
// cls       traditional | local | regional | un | academic | satellite | ground (same 7 classes as source-gatherer)
// format    what the item is
// origin    how it knows: wire | original reporting | official statement | analysis | fact-check | monitor | user-generated | social post (via report)
// who       who is named as speaking for it: named | pseudonymous | not stated
// term      words it uses for the event, only where the text was actually read
// topics    operation | casualties | legality | framing | transition | press | misinformation | court | congress | opposition | background
// seed      true = offered on the selection screen. The rest are only "found" by the mock scraper after selection.
//
// Summaries and claims are paraphrased for the prototype. Always open the original before relying on one.
(function (root) {
  root.SCENARIO = {
    id: 'venezuela-2026',
    label: 'US capture of Nicolás Maduro',
    from: '2026-01-03',
    to: '2026-01-16',
    keywords: ['venezuela', 'venezuelan', 'maduro', 'caracas', 'cilia', 'flores', 'delcy', 'rodríguez', 'rodriguez', 'machado', 'cabello', 'la guaira', 'catia', 'fuerte tiuna', 'absolute resolve'],
    suggestions: {
      who: ['Donald Trump', 'Nicolás Maduro', 'Cilia Flores', 'Delcy Rodríguez'],
      what: ['Kidnapping', 'Capture', 'US strikes'],
      when: ['Jan 3 – Jan 16, 2026'],
      where: ['Venezuela', 'Caracas', 'New York']
    },
    // Things the catalog itself shows are absent. Each states what was looked for.
    knownGaps: [
      { title: 'Venezuelan and Cuban state media', evidence: 'Searches found teleSUR, RT and TASS only described by other outlets, and Granma only as cited by Fox News. No state outlet was read directly.' },
      { title: 'Court documents', evidence: 'The indictment and arraignment appear only through news reports. No justice.gov or court filing was found.' },
      { title: 'US official casualty count', evidence: 'MercoPress says the administration released none; Fox News quotes officials on injuries and says they knew of no civilian casualties.' },
      { title: 'Original social posts', evidence: 'Most viral posts are known only through fact-checks. The Instagram and X links on the team list could not be opened without an account.' }
    ]
  };

  root.CATALOG = [
    // ---------- Team list ----------
    { id: 'pbs-ap', title: 'U.S. strikes Venezuela and says leader Maduro has been captured and flown out of the country',
      url: 'https://www.pbs.org/newshour/world/us-strikes-venezuela-and-says-its-leader-maduro-has-been-captured-and-flown-out-of-the-country',
      publisher: 'PBS NewsHour (AP)', published: '2026-01-03', cls: 'traditional', format: 'News article', lang: 'English', added: 'team', read: 'direct',
      origin: 'wire', who: 'named', term: ['captured', 'seized'], topics: ['operation', 'legality', 'congress', 'transition'], seed: true,
      summary: 'AP report on the overnight operation that took Maduro and Cilia Flores out of Venezuela. Covers the US plan to prosecute them, the Venezuelan government\'s condemnation, and early questions about legal authority.',
      claims: [
        { by: 'Donald Trump', text: 'The US would run Venezuela temporarily until a transition, and sell its oil.' },
        { by: 'Delcy Rodríguez', text: 'Maduro remains the only president and should be released; civilians and soldiers were killed (no number given).' },
        { by: 'Gen. Dan Caine', text: 'US forces rehearsed the operation for months.' },
        { by: 'Rep. Jim Himes', text: 'He had seen no evidence justifying a strike without congressional approval.' },
        { by: 'AP', text: 'At least seven explosions were reported.' }
      ] },
    { id: 'fox5-ap', title: 'Trump claims US will \'run\' Venezuela after Maduro captured',
      url: 'https://www.fox5dc.com/news/us-strikes-venezuela-maduro-reportedly-captured-explosions-shake-caracas-ap-reports',
      publisher: 'FOX 5 DC (AP)', published: '2026-01-03', cls: 'traditional', format: 'News article', lang: 'English', added: 'team', read: 'direct',
      origin: 'wire', who: 'named', term: ['captured'], topics: ['operation', 'transition', 'legality', 'congress'], seed: true,
      summary: 'Based on AP reporting. Trump\'s announcement, the charges in New York, and early international reaction. It notes there were no immediate signs the US was actually running the country.',
      claims: [
        { by: 'Donald Trump', text: 'A helicopter was hit and a few service members were injured; he believed none were killed.' },
        { by: 'Marco Rubio', text: 'Congress was called right after the operation, not before.' },
        { by: 'Delcy Rodríguez', text: 'She did not know where the couple were and asked for proof of life.' },
        { by: 'United Nations', text: 'Deeply alarmed; the strike may violate international law.' }
      ] },
    { id: 'fox-live', title: 'Maduro arraignment expected after helicopters fly Venezuelan leader to New York City',
      url: 'https://www.foxnews.com/live-news/maduro-captured-venezuela-attack-january-4-2026',
      publisher: 'Fox News', published: '2026-01-04', dateNote: 'Live blog with posts from Jan 4–5, last updated Jan 13.', cls: 'traditional', format: 'Live blog', lang: 'English', added: 'team', read: 'direct',
      origin: 'original reporting', who: 'named', term: ['captured', 'kidnapping (quoting Venezuelan officials)'], topics: ['operation', 'court', 'transition', 'casualties', 'legality'], seed: true,
      summary: 'Running updates on the flight to New York, the first court date, Rodríguez taking over, and US pressure over oil access. Records reactions from many US and foreign officials.',
      claims: [
        { by: 'Diosdado Cabello', text: 'Calls the seizure a kidnapping and says Maduro remains president.' },
        { by: 'Cuban government', text: '32 of its citizens were killed; it condemns the operation as state terrorism.' },
        { by: 'Mike Waltz', text: 'Defends the operation under Article 51 of the UN Charter.' },
        { by: 'Marco Rubio', text: 'A quarantine on Venezuelan oil is US leverage.' },
        { by: 'Sen. Chris Murphy', text: 'Venezuela is not a security threat and the operation benefits oil and financial interests.' }
      ] },
    { id: 'livenow-profile', title: 'Who is Nicolás Maduro? Venezuelan president captured by US forces',
      url: 'https://www.livenowfox.com/news/who-is-nicolas-maduro-venezuelan-president-captured-us-forces',
      publisher: 'LiveNOW from FOX', published: '2026-01-03', cls: 'traditional', format: 'Explainer', lang: 'English', added: 'team', read: 'direct',
      origin: 'original reporting', who: 'not stated', term: ['captured'], topics: ['background', 'court'], seed: true,
      summary: 'Background on Maduro\'s career, Venezuela\'s economic collapse, repression, the disputed 2024 election, and earlier US sanctions and rewards.',
      claims: [
        { by: 'LiveNOW from FOX', text: 'More than 7.7 million Venezuelans emigrated during his presidency.' },
        { by: 'LiveNOW from FOX', text: 'Opposition tally sheets showed Edmundo González winning by more than 2 to 1 in 2024.' },
        { by: 'Indictment, per the article', text: 'Up to 250 tons of cocaine moved through Venezuela by 2020.' }
      ] },
    { id: 'bbc-video', title: 'How the US captured Venezuela\'s President Nicolas Maduro | BBC News',
      url: 'https://www.youtube.com/watch?v=EsRvcr-l7Sg', youtube: 'EsRvcr-l7Sg',
      publisher: 'BBC News (YouTube)', published: null, dateNote: 'YouTube page gave no date. Not confirmed to be inside the window.', cls: 'traditional', format: 'Video', lang: 'English', added: 'team', read: 'none',
      origin: 'original reporting', who: 'not stated', topics: ['operation'], seed: true,
      summary: 'Only the title could be read. Watch the video to see what it covers.', claims: [] },
    { id: 'about-that', title: 'Did the U.S. really just kidnap Venezuela\'s president? | About That',
      url: 'https://www.youtube.com/watch?v=IpQ_Rp1YDRQ', youtube: 'IpQ_Rp1YDRQ',
      publisher: 'About That (YouTube)', published: null, dateNote: 'YouTube page gave no date or channel. Not confirmed to be inside the window.', cls: 'traditional', format: 'Video', lang: 'English', added: 'team', read: 'none',
      origin: 'analysis', who: 'not stated', term: ['kidnap (in the title)'], topics: ['legality', 'framing'], seed: true,
      summary: 'Only the title could be read. It asks whether "kidnap" is the right word for what happened.', claims: [] },
    { id: 'afp-factcheck', title: 'Ouster of Venezuela\'s Maduro unleashes waves of misinformation online',
      url: 'https://factcheck.afp.com/doc.afp.com.89P629E',
      publisher: 'AFP Fact Check', published: null, dateNote: 'Page would not open, so the date is not confirmed.', cls: 'traditional', format: 'Fact-check', lang: 'English', added: 'team', read: 'none',
      origin: 'fact-check', who: 'not stated', topics: ['misinformation'], seed: true,
      summary: 'The page would not open, so only the title is known. An AFP wire piece on the same subject is in this catalog through RNZ.', claims: [] },
    { id: 'cbs-images', title: 'Altered and misleading images proliferate on social media after Maduro\'s capture',
      url: 'https://www.cbsnews.com/news/maduro-capture-ai-images-false-information/',
      publisher: 'CBS News', published: '2026-01-05', cls: 'traditional', format: 'Fact-check', lang: 'English', added: 'team', read: 'direct',
      origin: 'fact-check', who: 'named', term: ['capture'], topics: ['misinformation'], seed: true,
      summary: 'CBS checked viral images and videos using reverse image search, comparison with verified material, and AI detection tools, which it notes can disagree. Several were AI-made or old footage; one it could not confirm either way.',
      claims: [
        { by: 'CBS News Confirmed', text: 'A widely shared photo of Maduro was likely made or edited with Google AI (SynthID).' },
        { by: 'CBS News', text: 'A photo of Maduro on an aircraft with soldiers got mixed results from two detectors and stays unconfirmed.' },
        { by: 'CBS News', text: 'A billboard-toppling video dates to July 2024; a strike video has circulated since June 2025.' }
      ] },
    { id: 'bbc-spies', title: 'Spies, drones and blowtorches: How the US captured Maduro',
      url: 'https://www.bbc.com/news/articles/cdred61epg4o',
      publisher: 'BBC News', published: '2026-01-05', dateNote: 'Date taken from an aggregator listing; the BBC page would not open.', cls: 'traditional', format: 'News article', lang: 'English', added: 'team', read: 'search',
      origin: 'original reporting', who: 'not stated', topics: ['operation'], seed: true,
      summary: 'Reconstruction of the raid, known here only through search-result text. Describes months of surveillance, spies inside Venezuela, and drones launched from US warships.',
      claims: [
        { by: 'BBC Verify', text: 'Confirmed strikes at five locations, including La Carlota and the Port of La Guaira.' },
        { by: 'Donald Trump', text: 'Forces brought blowtorches for steel doors but did not need them.' }
      ] },
    { id: 'ig-trump-spanish', title: 'Trump says he would learn Spanish and run for president of Venezuela',
      url: 'https://www.instagram.com/reel/DWzfC-Hjqcc/?rpxt=ZTZtdHA5dmswY3Mz',
      publisher: 'nbcnewyork (Instagram)', published: '2026-04-06', cls: 'ground', format: 'Social post', lang: 'English', added: 'team', read: 'direct',
      origin: 'social post (via report)', who: 'named', topics: ['transition'], seed: true,
      summary: 'NBC New York reel of a Trump press conference remark about Venezuela. Posted about three months after the scenario window.',
      claims: [{ by: 'Donald Trump', text: 'Said he would learn Spanish and run for president of Venezuela after leaving office.' }] },
    { id: 'ig-oct', title: 'Instagram post (could not be opened)',
      url: 'https://www.instagram.com/p/DfCFAogDUuU/?mdxt=MWxwZXozbmRxZXhmbQ%3D%3D',
      publisher: 'Instagram (account unknown)', published: '2026-10-28', dateNote: 'Date worked out from the post ID, not read from the page.', cls: 'ground', format: 'Social post', lang: 'Unknown', added: 'team', read: 'none',
      origin: 'user-generated', who: 'not stated', topics: [], seed: true,
      summary: 'Instagram showed nothing without an account, so the author and content are unknown. The post ID dates it to October 2026, well after the window.', claims: [] },
    { id: 'ig-jan3', title: 'Instagram post (could not be opened)',
      url: 'https://www.instagram.com/p/DTC01nXDiRK/?rpxt=bDNyZ3dmcm5yc2hi',
      publisher: 'Instagram (account unknown)', published: '2026-01-03', dateNote: 'Date worked out from the post ID, not read from the page.', cls: 'ground', format: 'Social post', lang: 'Unknown', added: 'team', read: 'none',
      origin: 'user-generated', who: 'not stated', topics: [], seed: true,
      summary: 'Instagram showed nothing without an account, so the author and content are unknown. The post ID dates it to Jan 3, the day of the operation.', claims: [] },
    { id: 'x-trending', title: 'X trending topic (could not be opened)',
      url: 'https://x.com/i/trending/2007334725430432254',
      publisher: 'X', published: '2026-01-03', dateNote: 'Date worked out from the link ID, not read from the page.', cls: 'ground', format: 'Social post', lang: 'Unknown', added: 'team', read: 'none',
      origin: 'user-generated', who: 'not stated', topics: [], seed: true,
      summary: 'X would not show this page without an account. The link ID dates it to Jan 3.', claims: [] },
    { id: 'state-crisis', title: 'Venezuela: A Democratic Crisis',
      url: 'https://2017-2021.state.gov/a-democratic-crisis-in-venezuela/',
      publisher: 'US State Department (archive)', published: null, dateNote: 'Archived site of the 2017–2021 administration, so it predates the window. Exact date unknown.', dateBefore: true, cls: 'un', format: 'Government page', lang: 'English', added: 'team', read: 'none',
      origin: 'official statement', who: 'not stated', topics: ['background'], seed: true,
      summary: 'The page returned an error, so only the title and its archive address are known. Useful as background on an earlier US position, not as reporting on January 2026.', claims: [] },

    // ---------- UN and institutional ----------
    { id: 'un-news', title: 'UN chief deeply concerned over \'possible intensification of instability\' in Venezuela',
      url: 'https://news.un.org/en/story/2026/01/1166701',
      publisher: 'UN News', published: '2026-01-05', cls: 'un', format: 'News article', lang: 'English', added: 'research', read: 'direct',
      origin: 'official statement', who: 'named', term: ['seizure', 'rendition'], topics: ['legality', 'casualties', 'framing'], seed: true,
      summary: 'The Secretary-General\'s remarks, delivered through Rosemary DiCarlo, to the emergency Security Council meeting. Raises concern about the UN Charter and regional instability. Notes the scale of casualties is unclear.',
      claims: [
        { by: 'António Guterres', text: 'Rules on the use of force were not respected in the Jan 3 action; it risks a dangerous precedent.' },
        { by: 'Venezuela', text: 'Describes the operation as military aggression violating the Charter.' }
      ] },
    { id: 'un-live', title: 'Security Council LIVE: \'The power of the law must prevail\' amid Venezuela crisis, says Guterres',
      url: 'https://www.un.org/en/security-council-live-world-powers-confront-%E2%80%98dangerous%E2%80%99-turning-point-venezuela',
      publisher: 'United Nations', published: '2026-01-05', cls: 'un', format: 'Live blog', lang: 'English', added: 'research', read: 'search',
      origin: 'official statement', who: 'named', topics: ['legality', 'framing'],
      summary: 'Live coverage of the emergency session, known here from search-result text. Member states set out opposing legal readings of the operation.',
      claims: [
        { by: 'Mike Waltz', text: 'The US described a law-enforcement action in pursuit of long-standing indictments.' },
        { by: 'Samuel Moncada', text: 'Venezuela called it an illegitimate armed attack with no legal basis.' }
      ] },
    { id: 'npr-un', title: 'U.S. faces broad condemnation for actions in Venezuela during U.N. emergency meeting',
      url: 'https://www.npr.org/2026/01/06/nx-s1-5667052/u-s-faces-broad-condemnation-for-actions-in-venezuela-during-u-n-emergency-meeting',
      publisher: 'NPR', published: '2026-01-06', cls: 'traditional', format: 'News article', lang: 'English', added: 'research', read: 'search',
      origin: 'original reporting', who: 'not stated', topics: ['legality'],
      summary: 'Report on the Security Council session. The page timed out, so only its headline and search text are known.', claims: [] },

    // ---------- Satellite and OSINT ----------
    { id: 'csis-imagery', title: 'Imagery from Venezuela Shows a Surgical Strike, Not Shock and Awe',
      url: 'https://www.csis.org/analysis/imagery-venezuela-shows-surgical-strike-not-shock-and-awe',
      publisher: 'CSIS', published: '2026-01-09', cls: 'satellite', format: 'Satellite analysis', lang: 'English', added: 'research', read: 'direct',
      origin: 'analysis', who: 'named', term: ['captured', 'raid'], topics: ['operation', 'casualties'], seed: true,
      summary: 'Satellite imagery of four sites after the raid. The authors read the strikes as narrow and meant to enable the raid, while noting reported deaths including civilians. Cloud cover limited one site.',
      claims: [
        { by: 'CSIS authors', text: 'Fort Tiuna took the heaviest damage of the four sites.' },
        { by: 'CSIS authors', text: 'At La Guaira only one pier and two warehouses were hit.' }
      ] },
    { id: 'cbs-satellite', title: 'Satellite images of Fuerte Tiuna after Maduro captured',
      url: 'https://www.cbsnews.com/news/fuerte-tiuna-satellite-images-after-maduro-captured',
      publisher: 'CBS News', published: '2026-01-03', cls: 'satellite', format: 'Satellite imagery', lang: 'English', added: 'research', read: 'direct',
      origin: 'original reporting', who: 'not stated', term: ['captured'], topics: ['operation'],
      summary: 'Before and after images from Vantor (Dec 22, 2025 and Jan 3, 2026) showing damaged vehicles, equipment and military buildings.',
      claims: [
        { by: 'CBS News', text: 'A CIA source inside the Venezuelan government helped track Maduro\'s location.' },
        { by: 'Nahum Fernández', text: 'Maduro was captured at Fuerte Tiuna.' }
      ] },
    { id: 'bellingcat', title: 'Inside the Strike: The US Munition That Hit a Residential Building in Venezuela',
      url: 'https://www.bellingcat.com/news/2026/01/07/inside-the-strike-the-us-munition-that-hit-a-residential-building-in-venezuela/',
      publisher: 'Bellingcat', published: '2026-01-07', cls: 'satellite', format: 'OSINT investigation', lang: 'English', added: 'research', read: 'direct',
      origin: 'analysis', who: 'named', topics: ['operation', 'casualties'], seed: true,
      summary: 'Geolocates an apartment complex in Catia La Mar and identifies fragments that appear to be from a US AGM-88 series missile. Could not determine why it hit the building or what the intended target was. Attributes the casualty detail to El Pitazo.',
      claims: [
        { by: 'Bellingcat', text: 'Fragments appear to come from an AGM-88 series missile.' },
        { by: 'US Department of Defense, per Bellingcat', text: 'A battle damage assessment was ongoing.' }
      ] },

    // ---------- Academic and legal ----------
    { id: 'cambridge', title: 'The US capture of Venezuela\'s Maduro: An international legal analysis',
      url: 'https://www.cam.ac.uk/research/news/the-us-capture-of-venezuelas-maduro-an-international-legal-analysis',
      publisher: 'University of Cambridge', published: '2026-01-08', cls: 'academic', format: 'Expert interview', lang: 'English', added: 'research', read: 'direct',
      origin: 'analysis', who: 'named', term: ['capture'], topics: ['legality'], seed: true,
      summary: 'Prof Marc Weller argues the operation was an unlawful use of force and rejects the law-enforcement and pro-democracy justifications. Warns about damage to international norms.',
      claims: [{ by: 'Marc Weller', text: 'Accepting the operation would weaken opposition to Russia\'s invasion of Ukraine.' }] },
    { id: 'cfr-noriega', title: 'Maduro\'s Capture and International Law: The Noriega Precedent',
      url: 'https://www.cfr.org/expert-brief/maduros-capture-and-international-law-noriega-precedent',
      publisher: 'Council on Foreign Relations', published: '2026-01-06', cls: 'academic', format: 'Expert brief', lang: 'English', added: 'research', read: 'direct',
      origin: 'analysis', who: 'named', term: ['capture'], topics: ['legality', 'background'],
      summary: 'David Scheffer compares the operation with the 1989 US invasion of Panama and the arrest of Manuel Noriega, drawing on his own 1991 writing.',
      claims: [{ by: 'David Scheffer', text: 'Cross-border drug trafficking calls for law enforcement responses, not military action.' }] },
    { id: 'chatham', title: 'The US capture of President Nicolás Maduro and attacks on Venezuela have no justification',
      url: 'https://www.chathamhouse.org/2026/01/us-capture-president-nicolas-maduro-and-attacks-venezuela-have-no-justification',
      publisher: 'Chatham House', published: null, dateNote: 'Link shows January 2026, but the page would not open to confirm the day.', cls: 'academic', format: 'Expert comment', lang: 'English', added: 'research', read: 'search',
      origin: 'analysis', who: 'not stated', term: ['capture'], topics: ['legality'],
      summary: 'Known from search-result text only. Finds no justification in international law, including self-defence.', claims: [] },
    { id: 'stanford', title: 'Flexing U.S. Power in Venezuela',
      url: 'https://law.stanford.edu/2026/01/10/flexing-u-s-power-in-venezuela/',
      publisher: 'Stanford Law School', published: '2026-01-10', cls: 'academic', format: 'Expert comment', lang: 'English', added: 'research', read: 'search',
      origin: 'analysis', who: 'named', topics: ['legality'],
      summary: 'Known from search-result text only. Allen Weiner argues FBI arrest authority under US law does not answer the international law question.', claims: [] },
    { id: 'justsecurity', title: 'U.S. Allies and Adversaries Reactions to Operation Absolute Resolve',
      url: 'https://www.justsecurity.org/131396/maduro-allies-adversaries-react/',
      publisher: 'Just Security', published: null, dateNote: 'Page would not open, so the date is not confirmed.', cls: 'academic', format: 'Collected reactions', lang: 'English', added: 'research', read: 'search',
      origin: 'analysis', who: 'not stated', topics: ['legality', 'framing'],
      summary: 'A collection of state reactions, known here only from its title in search results.', claims: [] },

    // ---------- Casualty figures ----------
    { id: 'fox-100', title: 'Venezuela says 100 were killed in US operation to capture Maduro: report',
      url: 'https://www.foxnews.com/world/venezuela-says-100-were-killed-us-operation-capture-maduro-report.amp',
      publisher: 'Fox News', published: '2026-01-08', cls: 'traditional', format: 'News article', lang: 'English', added: 'research', read: 'direct',
      origin: 'original reporting', who: 'named', term: ['capture'], topics: ['casualties'], seed: true,
      summary: 'Sets the Venezuelan, Cuban and US figures side by side. The article does not verify or break down the 100 figure.',
      claims: [
        { by: 'Diosdado Cabello, via Reuters', text: '100 people were killed. The army listed 23 of its dead by name.' },
        { by: 'Granma', text: '32 members of Cuba\'s armed forces died.' },
        { by: 'Department of War official', text: 'Not aware of any civilian casualties.' },
        { by: 'Administration official', text: 'Seven US service members were injured.' }
      ] },
    { id: 'mercopress', title: 'Maduro\'s arrest leaves between 40 and 80 dead, including 32 Cubans',
      url: 'https://en.mercopress.com/2026/01/05/maduro-s-arrest-leaves-between-40-and-80-dead-including-32-cubans',
      publisher: 'MercoPress', published: '2026-01-05', cls: 'regional', format: 'News article', lang: 'English', added: 'research', read: 'direct',
      origin: 'original reporting', who: 'not stated', term: ['arrest', 'seize'], topics: ['casualties'],
      summary: 'Early range of deaths from reports inside Venezuela, stating independent verification was not yet possible. Also reports Trump naming Colombia and Mexico as possible future targets.',
      claims: [
        { by: 'MercoPress', text: 'Reports from Venezuela put the total at 40 to 80 dead.' },
        { by: 'MercoPress', text: 'The Trump administration has released no official count.' }
      ] },
    { id: 'monitor-victimas', title: 'Monitor de Víctimas and La Hora de Venezuela death tally',
      url: 'https://airwars.org/source/runrun-es-la-hora-de-venezuela-2026-01-06-153637/',
      publisher: 'Runrun.es / La Hora de Venezuela (via Airwars)', published: '2026-01-06', dateNote: 'Date from the Airwars archive link.', cls: 'local', format: 'Casualty monitor', lang: 'Spanish', added: 'research', read: 'search',
      origin: 'monitor', who: 'not stated', topics: ['casualties'], seed: true,
      summary: 'Independent media tally, known from search-result text. Counted 55 deaths in Caracas, Miranda and La Guaira as of Jan 5, including at least 22 soldiers. Other reports give 77 by Jan 6.',
      claims: [{ by: 'Monitor de Víctimas', text: 'At least 55 dead as of Jan 5.' }] },
    { id: 'razon-cabello', title: 'Diosdado Cabello afirma que hasta ahora son 100 los fallecidos en el ataque de EU a Venezuela',
      url: 'https://www.razon.com.mx/mundo/2026/01/07/diosdado-cabello-afirma-que-hasta-ahora-son-100-los-fallecidos-en-el-ataque-de-eu-a-venezuela/',
      publisher: 'La Razón (Mexico)', published: '2026-01-07', cls: 'regional', format: 'News article', lang: 'Spanish', added: 'research', read: 'search',
      origin: 'official statement', who: 'named', term: ['ataque'], topics: ['casualties'],
      summary: 'Reports the interior minister\'s preliminary count, known from search-result text.',
      claims: [{ by: 'Diosdado Cabello', text: '100 deaths counted so far.' }] },
    { id: 'democracynow', title: 'Venezuela\'s military announces 24 security officers were killed in US attack',
      url: 'https://www.democracynow.org/2026/1/7/headlines/venezuelas_military_announces_24_security_officers_were_killed_in_us_attack',
      publisher: 'Democracy Now!', published: '2026-01-07', cls: 'traditional', format: 'News headline', lang: 'English', added: 'research', read: 'search',
      origin: 'original reporting', who: 'not stated', term: ['attack'], topics: ['casualties'],
      summary: 'Headline item known from search results only. Gives 24 where Fox News reports 23 names from the same army list.', claims: [] },

    // ---------- Local and regional, on the ground ----------
    { id: 'eldiario-testimonios', title: '"Lo que vivimos no fue fácil": los testimonios de civiles que vivieron de cerca los bombardeos en Caracas',
      url: 'https://eldiario.com/2026/01/04/testimonios-civiles-que-vivieron-cerca-bombardeos-caracas/',
      publisher: 'El Diario (Venezuela)', published: '2026-01-04', cls: 'local', format: 'Witness accounts', lang: 'Spanish', added: 'research', read: 'direct',
      origin: 'original reporting', who: 'pseudonymous', term: ['operación'], topics: ['operation', 'casualties'], seed: true,
      summary: 'Residents near the bombings describe explosions, broken windows, and loss of power, gas, water and phone service. Witnesses use pseudonyms at their own request.',
      claims: [{ by: 'Residents (pseudonyms)', text: 'Power, gas, water and phone service were lost near the strikes.' }] },
    { id: 'eldiario-sntp', title: 'SNTP ascendió a 24 la cifra de periodistas detenidos en Venezuela',
      url: 'https://eldiario.com/2026/01/12/sntp-periodistas-detenidos-en-venezuela-quienes-son/',
      publisher: 'El Diario (Venezuela)', published: '2026-01-12', cls: 'local', format: 'News article', lang: 'Spanish', added: 'research', read: 'direct',
      origin: 'original reporting', who: 'named', topics: ['press'],
      summary: 'The press union SNTP counts 24 press workers detained and profiles each. It says the count rises as frightened relatives come forward. Several detentions predate January 2026.',
      claims: [{ by: 'SNTP', text: '24 press workers are held illegally and arbitrarily.' }] },
    { id: 'elnacional-sntp', title: 'SNTP exigió la liberación de los 22 periodistas que permanecen detenidos en Venezuela',
      url: 'https://www.elnacional.com/2026/01/sntp-exigio-la-libertad-de-los-22-periodistas-que-permanecen-detenidos-en-venezuela/',
      publisher: 'El Nacional (Venezuela)', published: '2026-01-10', cls: 'local', format: 'News article', lang: 'Spanish', added: 'research', read: 'direct',
      origin: 'original reporting', who: 'named', topics: ['press'],
      summary: 'Reports an SNTP post on X with the names of 22 detained press workers, and a release on Jan 8.',
      claims: [{ by: 'SNTP', text: '22 press workers remain detained as of Jan 9.' }] },
    { id: 'infobae-press', title: 'Subió a 14 el número de periodistas detenidos por el régimen chavista en el centro de Caracas',
      url: 'https://www.infobae.com/venezuela/2026/01/05/al-menos-siete-periodistas-fueron-detenidos-por-funcionarios-chavistas-en-el-centro-de-caracas/',
      publisher: 'Infobae', published: '2026-01-05', cls: 'regional', format: 'News article', lang: 'Spanish', added: 'research', read: 'direct',
      origin: 'original reporting', who: 'named', term: ['régimen chavista (for the government)'], topics: ['press'], seed: true,
      summary: 'SNTP says at least 14 press workers were detained at the National Assembly opening, 11 from international media. Phones were searched. Also cites 60+ news sites blocked online.',
      claims: [
        { by: 'SNTP', text: 'At least 14 detained; ten still held at the time of writing.' },
        { by: 'SNTP', text: 'More than 60 news sites are blocked online.' }
      ] },
    { id: 'breitbart-press', title: 'Socialists, Still in Power, Arrest at Least 14 Journalists in Venezuela',
      url: 'https://www.breitbart.com/latin-america/2026/01/06/socialists-still-in-power-arrest-at-least-14-journalists-in-venezuela',
      publisher: 'Breitbart', published: '2026-01-06', cls: 'traditional', format: 'News article', lang: 'English', added: 'research', read: 'search',
      origin: 'original reporting', who: 'not stated', topics: ['press'],
      summary: 'Same detentions as Infobae and El Nacional under a differently framed headline. Known from search results only.', claims: [] },
    { id: 'aljazeera-delcy', title: 'Who is Venezuelan Vice President Delcy Rodriguez, now leading the country?',
      url: 'https://www.aljazeera.com/news/2026/1/4/who-is-venezuelan-vice-president-delcy-rodriguez-now-leading-the-country',
      publisher: 'Al Jazeera', published: '2026-01-04', cls: 'traditional', format: 'Explainer', lang: 'English', added: 'research', read: 'direct',
      origin: 'original reporting', who: 'named', term: ['abduction'], topics: ['transition', 'framing'], seed: true,
      summary: 'Profile of Rodríguez after a Supreme Court order made her interim leader. Uses "abduction" for Maduro\'s removal, where most English-language wire copy here uses "captured".',
      claims: [
        { by: 'Donald Trump', text: 'Rodríguez is essentially willing to do what the US thinks is necessary.' },
        { by: 'Delcy Rodríguez', text: 'Demanded Maduro\'s release and proof of life, calling the action brutal aggression.' }
      ] },
    { id: 'telemundo-court', title: 'Trump dice que EE.UU. no está en guerra con Venezuela y Maduro comparece en corte en Nueva York: "Estoy secuestrado"',
      url: 'https://www.telemundo.com/noticias/noticias-telemundo/estados-unidos/live-blog/venezuela-maduro-corte-trump-colombia-congreso-ataque-migrantes-delcy-rcna252310',
      publisher: 'Telemundo', published: '2026-01-05', dateNote: 'Date inferred from the court appearance it covers.', cls: 'regional', format: 'Live blog', lang: 'Spanish', added: 'research', read: 'search',
      origin: 'original reporting', who: 'named', term: ['secuestrado (quoting Maduro)'], topics: ['court', 'framing'],
      summary: 'Live coverage of the first court appearance, known from search-result text.',
      claims: [{ by: 'Nicolás Maduro', text: 'Told the court he had been kidnapped.' }] },
    { id: 'amny-court', title: 'Nicolás Maduro pleads not guilty to drug trafficking, gun charges in Manhattan',
      url: 'https://www.amny.com/news/nicolas-maduro-pleads-not-guilty-to-drug-trafficking-gun-charges-in-manhattan',
      publisher: 'amNY', published: '2026-01-05', dateNote: 'Date inferred from the arraignment it covers.', cls: 'local', format: 'News article', lang: 'English', added: 'research', read: 'search',
      origin: 'original reporting', who: 'named', topics: ['court'], seed: true,
      summary: 'New York report on the arraignment, known from search-result text. Maduro and Flores pleaded not guilty.',
      claims: [{ by: 'Reported court record', text: 'Both pleaded not guilty; neither applied for bail.' }] },
    { id: 'ekantipur-media', title: 'What did the Iranian, Russian, and Turkish media write about Maduro\'s arrest?',
      url: 'https://ekantipur.com/world/2026/01/04/en/what-did-the-iranian-russian-and-turkish-media-write-about-maduros-arrest-48-50.html',
      publisher: 'eKantipur (Nepal)', published: '2026-01-04', cls: 'regional', format: 'Media roundup', lang: 'English', added: 'research', read: 'search',
      origin: 'analysis', who: 'not stated', topics: ['framing'],
      summary: 'Secondhand look at foreign state-linked coverage, known from search results. One of the few windows here into how those outlets framed the event.',
      claims: [{ by: 'eKantipur, on RT and TASS', text: 'Described as a planned military attack for regime change.' }] },

    // ---------- US politics and the opposition ----------
    { id: 'rollcall', title: 'Senate advances Venezuela war powers measure',
      url: 'https://rollcall.com/2026/01/08/senate-advances-venezuela-war-powers-measure/',
      publisher: 'Roll Call', published: '2026-01-08', cls: 'traditional', format: 'News article', lang: 'English', added: 'research', read: 'direct',
      origin: 'original reporting', who: 'named', term: ['capture'], topics: ['congress'], seed: true,
      summary: 'Senate votes 52–47 to bring a war powers resolution out of committee. Three Republicans changed their earlier votes. Final passage was still pending.',
      claims: [{ by: 'Roll Call', text: 'The vote was 52–47 with five Republicans in favour.' }] },
    { id: 'star-senate', title: 'US Senate narrowly blocks effort to rein in Trump\'s Venezuela war powers',
      url: 'https://www.thestar.com.my/news/world/2026/01/15/us-senate-narrowly-blocks-effort-to-rein-in-trump039s-venezuela-war-powers',
      publisher: 'The Star (Malaysia)', published: '2026-01-15', cls: 'regional', format: 'News article', lang: 'English', added: 'research', read: 'search',
      origin: 'original reporting', who: 'not stated', topics: ['congress'],
      summary: 'The resolution was dismissed on a 51–50 point of order with Vice President Vance breaking the tie. Known from search-result text; sources differ on details.',
      claims: [{ by: 'Search-result text', text: '51–50 to dismiss, with Vance casting the deciding vote.' }] },
    { id: 'npr-machado', title: 'Opposition leader María Corina Machado meets with Trump to discuss Venezuela\'s future',
      url: 'https://www.hppr.org/2026-01-16/opposition-leader-maria-corina-machado-meets-with-trump-to-discuss-venezuelas-future',
      publisher: 'NPR (via HPPR)', published: '2026-01-16', cls: 'traditional', format: 'Radio transcript', lang: 'English', added: 'research', read: 'direct',
      origin: 'original reporting', who: 'named', term: ['seizure', 'capture'], topics: ['opposition', 'transition'], seed: true,
      summary: 'Machado meets Trump in Washington while Rodríguez gives a state-of-the-nation speech in Caracas. The government and rights groups disagree on how many prisoners have been freed.',
      claims: [
        { by: 'Venezuelan government', text: 'More than 400 prisoners have been released.' },
        { by: 'Rights groups, per NPR', text: 'The number released is in the dozens; more than 800 remain jailed.' }
      ] },

    // ---------- Fact-checks ----------
    { id: 'rnz-afp', title: 'AI and outdated visuals fuel misinformation after Maduro capture',
      url: 'https://www.rnz.co.nz/news/world/583430/ai-and-outdated-visuals-fuel-misinformation-after-maduro-capture',
      publisher: 'RNZ (AFP)', published: '2026-01-07', cls: 'traditional', format: 'Fact-check', lang: 'English', added: 'research', read: 'direct',
      origin: 'wire', who: 'named', term: ['seizure', 'capture'], topics: ['misinformation'], seed: true,
      summary: 'AFP on fake and recycled visuals after the operation, including a clip Trump himself shared. NewsGuard counted seven items reaching over 14 million views on X in two days.',
      claims: [
        { by: 'AFP', text: 'The "celebration" clip Trump shared shows a UCLA student tradition, first posted on TikTok.' },
        { by: 'NewsGuard, via AFP', text: 'Seven false items drew more than 14 million views on X within two days.' }
      ] },
    { id: 'aap-factcheck', title: 'Maduro\'s capture in Venezuela unleashes flood of fake pictures and videos',
      url: 'https://www.aap.com.au/factcheck/maduros-capture-in-venezuela-unleashes-flood-of-fake-pictures-and-videos/',
      publisher: 'AAP FactCheck', published: '2026-01-14', cls: 'regional', format: 'Fact-check', lang: 'English', added: 'research', read: 'direct',
      origin: 'fact-check', who: 'named', term: ['capture', 'arrest'], topics: ['misinformation'],
      summary: 'Rates six images and videos false, with the evidence for each. Notes that as of publication no real bodycam footage of the raid had been released.',
      claims: [{ by: 'AAP FactCheck', text: 'A handcuffed "Maduro" image was built from a 2022 photo of Viktor Medvedchuk.' }] },
    { id: 'chequeado', title: 'Todas las desinformaciones que siguen circulando sobre la captura de Maduro',
      url: 'https://chequeado.com/ultimas-noticias/todas-las-desinformaciones-que-siguen-circulando-sobre-la-captura-de-maduro-y-la-ofensiva-militar-de-ee-uu-en-venezuela/',
      publisher: 'Chequeado (Argentina)', published: '2026-01-05', cls: 'regional', format: 'Fact-check', lang: 'Spanish', added: 'research', read: 'direct',
      origin: 'fact-check', who: 'not stated', term: ['captura', 'operación'], topics: ['misinformation'],
      summary: 'Spanish-language fact-check of five items. Includes footage geolocated to Santiago de Chile and a film scene passed off as real torture.',
      claims: [{ by: 'Chequeado', text: '"Caracas celebration" footage was geolocated to Santiago de Chile.' }] },

    // ---------- Social posts, known through the reports that describe them ----------
    { id: 'post-iwojima', title: 'Trump\'s Truth Social post of Maduro aboard the USS Iwo Jima',
      url: 'https://www.mediaite.com/media/news/trump-posts-image-of-captured-maduro-truth-social-gets-jammed-up-right-after/',
      publisher: 'Donald Trump on Truth Social (via Mediaite)', published: '2026-01-03', cls: 'ground', format: 'Social post', lang: 'English', added: 'research', read: 'direct',
      origin: 'social post (via report)', who: 'named', topics: ['operation', 'framing'], seed: true,
      summary: 'The first image the US released of Maduro in custody, eyes and ears covered. Mediaite reports the platform briefly slowed afterwards. Original post not linked.',
      claims: [] },
    { id: 'post-undie', title: '"Venezuelans celebrating" clip, actually a UCLA student tradition',
      url: 'https://www.rnz.co.nz/news/world/583430/ai-and-outdated-visuals-fuel-misinformation-after-maduro-capture',
      publisher: 'Shared on Truth Social and TikTok (via AFP)', published: null, dateNote: 'Reported by Jan 7. The original post date is not stated.', cls: 'ground', format: 'Social post', lang: 'English', added: 'research', read: 'direct',
      origin: 'social post (via report)', who: 'named', topics: ['misinformation'], factcheck: 'False context, per AFP', seed: true,
      summary: 'Video shared by President Trump as celebrating Venezuelans. AFP traced it to students at UCLA. Original post not linked.', claims: [] },
    { id: 'post-ai-custody', title: 'AI-made image of Maduro in US custody',
      url: 'https://www.aap.com.au/factcheck/maduros-capture-in-venezuela-unleashes-flood-of-fake-pictures-and-videos/',
      publisher: 'X, Facebook (via AAP, AFP and CBS)', published: '2026-01-03', dateNote: 'Date as given by AAP.', cls: 'ground', format: 'Social post', lang: 'English', added: 'research', read: 'direct',
      origin: 'social post (via report)', who: 'not stated', topics: ['misinformation'], factcheck: 'AI-generated, per AFP, AAP and CBS', seed: true,
      summary: 'Shared as the first image of Maduro in US custody, including by a Florida mayor according to CBS. All three fact-checks link it to Google\'s AI tools through SynthID. Original posts not linked.', claims: [] },
    { id: 'post-bodycam', title: '"Bodycam footage" of the raid',
      url: 'https://www.aap.com.au/factcheck/maduros-capture-in-venezuela-unleashes-flood-of-fake-pictures-and-videos/',
      publisher: 'Instagram, TikTok (via AAP)', published: null, dateNote: 'Reported by Jan 14. The original post date is not stated.', cls: 'ground', format: 'Social post', lang: 'Unknown', added: 'research', read: 'direct',
      origin: 'social post (via report)', who: 'not stated', topics: ['misinformation'], factcheck: 'AI-generated, per AAP',
      summary: 'Purported bodycam video of the capture. AAP rates it AI-generated. Original posts not linked.', claims: [] },
    { id: 'post-simon', title: 'Film scene shared as real torture of opponents',
      url: 'https://chequeado.com/ultimas-noticias/todas-las-desinformaciones-que-siguen-circulando-sobre-la-captura-de-maduro-y-la-ofensiva-militar-de-ee-uu-en-venezuela/',
      publisher: 'Social media (via Chequeado)', published: null, dateNote: 'Reported by Jan 5. The original post date is not stated.', cls: 'ground', format: 'Social post', lang: 'Spanish', added: 'research', read: 'direct',
      origin: 'social post (via report)', who: 'not stated', topics: ['misinformation'], factcheck: 'False context, per Chequeado',
      summary: 'A scene from the 2023 Venezuelan film Simón, which had also circulated during the 2024 protests. Original posts not linked.', claims: [] },
    { id: 'post-sntp', title: 'SNTP post on X naming detained press workers',
      url: 'https://www.elnacional.com/2026/01/sntp-exigio-la-libertad-de-los-22-periodistas-que-permanecen-detenidos-en-venezuela/',
      publisher: 'SNTP on X (via El Nacional)', published: '2026-01-09', dateNote: 'Date of the count, as reported.', cls: 'ground', format: 'Social post', lang: 'Spanish', added: 'research', read: 'direct',
      origin: 'social post (via report)', who: 'named', topics: ['press'],
      summary: 'A press union using X to publish names and photos of detainees. Original post not linked.', claims: [] }
  ];

  // Facts about how entries relate, offered to the analyst as suggestions. Never drawn until they accept one.
  root.CATALOG_LINKS = [
    { a: 'pbs-ap', b: 'fox5-ap', rel: 'Same origin', why: 'Both are based on AP reporting.' },
    { a: 'afp-factcheck', b: 'rnz-afp', rel: 'Same origin', why: 'Both are AFP on the same subject.' },
    { a: 'rnz-afp', b: 'post-undie', rel: 'Checks this', why: 'AFP traced this clip.' },
    { a: 'rnz-afp', b: 'post-ai-custody', rel: 'Checks this', why: 'AFP reviewed this image.' },
    { a: 'aap-factcheck', b: 'post-ai-custody', rel: 'Checks this', why: 'AAP reviewed this image.' },
    { a: 'cbs-images', b: 'post-ai-custody', rel: 'Checks this', why: 'CBS reviewed this image.' },
    { a: 'aap-factcheck', b: 'post-bodycam', rel: 'Checks this', why: 'AAP reviewed this video.' },
    { a: 'chequeado', b: 'post-simon', rel: 'Checks this', why: 'Chequeado reviewed this video.' },
    { a: 'elnacional-sntp', b: 'post-sntp', rel: 'Reports on', why: 'El Nacional reports this post.' },
    { a: 'fox-100', b: 'razon-cabello', rel: 'Same claim', why: 'Both report Cabello\'s figure of 100.' },
    { a: 'fox-100', b: 'mercopress', rel: 'Different figures', why: '100 dead against an earlier range of 40 to 80.' },
    { a: 'fox-100', b: 'monitor-victimas', rel: 'Different figures', why: '100 dead against a tally of 55 as of Jan 5.' },
    { a: 'fox-100', b: 'democracynow', rel: 'Different figures', why: '23 names on the army list against 24.' },
    { a: 'bellingcat', b: 'csis-imagery', rel: 'Same subject', why: 'Both use satellite imagery of the strike sites.' },
    { a: 'csis-imagery', b: 'cbs-satellite', rel: 'Same subject', why: 'Both show Fort Tiuna damage.' },
    { a: 'infobae-press', b: 'breitbart-press', rel: 'Same event', why: 'Same detentions with different framing.' },
    { a: 'eldiario-sntp', b: 'elnacional-sntp', rel: 'Different figures', why: '24 detained on Jan 12 against 22 on Jan 9.' },
    { a: 'rollcall', b: 'star-senate', rel: 'Same subject', why: 'Two stages of the same resolution.' },
    { a: 'un-news', b: 'npr-un', rel: 'Same event', why: 'Both cover the Jan 5 Security Council session.' },
    { a: 'telemundo-court', b: 'amny-court', rel: 'Same event', why: 'Both cover the Jan 5 arraignment.' },
    { a: 'about-that', b: 'aljazeera-delcy', rel: 'Same subject', why: 'Both use kidnap or abduct language.' }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
