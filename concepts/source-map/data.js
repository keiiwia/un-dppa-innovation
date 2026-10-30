/* Source Map data. Edit this file to add or change items; the page reads it as-is.

   Stage:  { name, stage, question, who, decide, children: [branches] }
   Branch: { name, children: [items] }
   Item:   { name, url, type, cost, access, from, what, silence, limits }
     type    tool | source | practice | case
     cost    free | freemium | paid
     access  open | registration | un      (un = UN or partner access only)
     from    kelly | ethan | meeting | concept | added
   Case:   { name, url, type: "case", illustrates, went, revealed, from, status }
     status  "to research" for candidates nobody has written up yet
   Input:  { name, type: "input", from, what, silence }
     a required setting the analyst picks before anything else (10/27 launch flow)

   LINK_CHECK at the bottom is filled in by checking every url. */

window.SOURCE_MAP = {
  name: "Quiet or Unheard?",
  children: [
    {
      name: "Set the scene", stage: 1,
      question: "What's going on here, and what does normal coverage look like?",
      who: "Person sets country, region and issue. The tool shows data and statistics first, then context.",
      decide: "The analyst picks the situation. The tool doesn't suggest one.",
      children: [
        { name: "Choose the situation", children: [
          { name: "Country", type: "input", from: "meeting",
            what: "Which country or countries the analyst is looking at. Required, and set first.",
            silence: "Decides which outlets, languages and data count as normal coverage." },
          { name: "Region", type: "input", from: "meeting",
            what: "Where in the country, for example Northwest Cameroon. Required.",
            silence: "Silence is uneven inside a country: the capital can be loud while a region goes unheard." },
          { name: "Issue or crisis", type: "input", from: "meeting",
            what: "What the analyst is working on, for example an active conflict or a protest. Required.",
            silence: "Decides which signals matter. A protest and a conflict go quiet in different ways." }
        ]},
        { name: "Data & statistics", children: [
          { name: "ACLED", url: "https://acleddata.com", type: "source", cost: "free", access: "registration", from: "kelly",
            what: "Armed Conflict Location & Event Data: coded political violence and protest events.",
            silence: "Event counts over time show when a place goes quiet in the data.",
            limits: "Built mostly from news, which under-reports rural and local-language areas. GeoGuard found no category for farmer-herder clashes." },
          { name: "UCDP", url: "https://ucdp.uu.se", type: "source", cost: "free", access: "open", from: "kelly",
            what: "Uppsala Conflict Data Program: conflict and fatality data going back decades.",
            silence: "A long baseline for comparing today's reporting with the past.",
            limits: "Same news-based blind spots as ACLED, including farmer-herder clashes." },
          { name: "GDELT", url: "https://www.gdeltproject.org", type: "source", cost: "free", access: "open", from: "kelly",
            what: "Monitors world news in many languages and codes it into events.",
            silence: "Shows when a place drops out of the news, not just when events stop.",
            limits: "Machine-coded and noisy. Only as wide as the news it reads." },
          { name: "HDX", url: "https://data.humdata.org", type: "source", cost: "free", access: "open", from: "added",
            what: "OCHA's Humanitarian Data Exchange: thousands of datasets in one place.",
            silence: "Shows which data exists for a place, and which is missing or out of date." }
        ]},
        { name: "Country context", children: [
          { name: "CrisisWatch", url: "https://www.crisisgroup.org/crisiswatch", type: "source", cost: "free", access: "open", from: "added",
            what: "Crisis Group's monthly tracker of conflict developments in dozens of countries.",
            silence: "A running record of what's been happening, so a sudden lack of news has something to be compared against." },
          { name: "ReliefWeb", url: "https://reliefweb.int", type: "source", cost: "free", access: "open", from: "added",
            what: "OCHA's site for humanitarian reports, maps and updates.",
            silence: "Shows which agencies report from a place, and how often." },
          { name: "ACAPS", url: "https://www.acaps.org", type: "source", cost: "free", access: "open", from: "concept",
            what: "Independent humanitarian analysis for crisis countries.",
            silence: "Marks missing indicators as an \"information gap\" instead of leaving them blank." },
          { name: "Security Council Report", url: "https://www.securitycouncilreport.org", type: "source", cost: "free", access: "open", from: "added",
            what: "Independent monthly forecast and tracking of the Security Council's agenda.",
            silence: "Shows which situations are on the Council's radar, and which aren't." }
        ]},
        { name: "Academic research", children: [
          { name: "Google Scholar", url: "https://scholar.google.com", type: "tool", cost: "free", access: "open", from: "added",
            what: "Search engine for peer-reviewed papers, theses and books.",
            silence: "What researchers have documented about a place over years, including patterns from before the current news cycle.",
            limits: "Slow: research comes out months or years after events. Mostly English, and mostly about places researchers can reach." },
          { name: "African Journals Online", url: "https://www.ajol.info", type: "source", cost: "freemium", access: "open", from: "added",
            what: "Peer-reviewed journals published in Africa, many of them open access.",
            silence: "Regional scholars often write about places international outlets ignore.",
            limits: "Africa only. Coverage varies by journal." },
          { name: "JSTOR", url: "https://www.jstor.org", type: "source", cost: "freemium", access: "registration", from: "added",
            what: "Archive of academic journals and books going back decades.",
            silence: "Historical patterns: how this kind of silence played out in a place before.",
            limits: "Full text usually needs a library subscription." },
          { name: "Dag Hammarskjöld Library", url: "https://www.un.org/en/library", type: "source", cost: "free", access: "un", from: "added",
            what: "The UN's library. Gives UN staff research help and access to academic databases.",
            silence: "A way into paid academic sources from a UN machine, without a separate licence.",
            limits: "Which databases it covers is a question for Silva." }
        ]},
        { name: "Normal coverage", children: [
          { name: "Media Cloud", url: "https://www.mediacloud.org", type: "tool", cost: "free", access: "registration", from: "added",
            what: "Open-source tool for searching and counting online news coverage over time.",
            silence: "Shows how much a place is usually covered and by which outlets, so a drop stands out.",
            limits: "Strongest for online news. Thin for radio and local-language outlets." },
          { name: "Radio Garden", url: "https://radio.garden", type: "tool", cost: "free", access: "open", from: "added",
            what: "A globe of live radio stations you can listen to.",
            silence: "Shows which local stations broadcast from a region: a rough sense of who could be heard, if anyone listened.",
            limits: "Only stations that stream online." },
          { name: "Media mix check", type: "practice", cost: "free", access: "open", from: "meeting",
            what: "Note which kinds of media are reporting: international, regional, local-language, institutional (within the UN).",
            silence: "Two reports, both in English from the capital, is a different signal from two reports in the local language." }
        ]},
        { name: "UN archive", children: [
          { name: "UN Digital Library", url: "https://digitallibrary.un.org", type: "source", cost: "free", access: "open", from: "meeting",
            what: "UN documents, resolutions, reports and speeches.",
            silence: "Previous or similar cases: how often a place came up before, and what was said." },
          { name: "UN Peacemaker", url: "https://peacemaker.un.org", type: "source", cost: "free", access: "open", from: "added",
            what: "DPPA's database of peace agreements and mediation guidance." },
          { name: "Internal case records", type: "source", cost: "free", access: "un", from: "meeting",
            what: "Internal archives of previous and similar cases, held by DPPA and other offices.",
            silence: "What the UN already knew about past silences in the same place, and when." }
        ]}
      ]
    },
    {
      name: "Watch what's arriving", stage: 2,
      question: "What is being reported now, from whom, and in which languages?",
      who: "Tool.",
      decide: "The tool counts and compares against normal. It doesn't say what the numbers mean.",
      children: [
        { name: "News & media", children: [
          { name: "BBC Monitoring", url: "https://monitoring.bbc.co.uk", type: "source", cost: "paid", access: "registration", from: "added",
            what: "Monitors and translates local broadcast, print and online media worldwide.",
            silence: "Local-language media is often where an unheard place is heard first." }
        ]},
        { name: "Local & community voices", children: [
          { name: "Colleagues on the ground", type: "practice", cost: "free", access: "un", from: "kelly",
            what: "Field officers and local contacts, often over WhatsApp. Usually the first word that something is happening.",
            silence: "When they go quiet too, that's a signal in itself." },
          { name: "Remesh", url: "https://www.remesh.ai", type: "tool", cost: "paid", access: "registration", from: "kelly",
            what: "AI-assisted digital dialogues with large groups. DPPA already works with it.",
            silence: "Anonymous, low-bandwidth and in local languages. It reaches people who don't post publicly, and shows where they won't talk: Kelly's \"two layers of quiet.\"" },
          { name: "U-Report", url: "https://www.u-report.org", type: "tool", cost: "free", access: "open", from: "added",
            what: "UNICEF's youth polling over SMS and messaging apps.",
            silence: "Asks people directly, where little is published.",
            limits: "Only reaches people who have signed up in that country." },
          { name: "Ushahidi", url: "https://www.ushahidi.com", type: "tool", cost: "freemium", access: "registration", from: "added",
            what: "Platform for crowdsourced crisis reports and maps.",
            silence: "Collects reports from people, not outlets." },
          { name: "KoBoToolbox", url: "https://www.kobotoolbox.org", type: "tool", cost: "free", access: "registration", from: "added",
            what: "Field survey and data collection tool used widely by humanitarian teams.",
            silence: "Structured reports from places media doesn't reach." }
        ]},
        { name: "Social & messaging", children: [
          { name: "TGStat", url: "https://tgstat.com", type: "tool", cost: "freemium", access: "open", from: "ethan",
            what: "Catalog and statistics for public Telegram channels.",
            silence: "Shows which channels cover a place and how active they are. A busy channel going quiet is a signal.",
            limits: "Some channels are red herrings (Kelly's notes)." },
          { name: "Telegram API", url: "https://core.telegram.org", type: "tool", cost: "free", access: "registration", from: "ethan",
            what: "Telegram's official API for reading public channels.",
            silence: "Lets a tool track how much each channel posts over time." },
          { name: "Junkipedia", url: "https://www.junkipedia.org", type: "tool", cost: "free", access: "registration", from: "added",
            what: "Monitors public posts across platforms, including Telegram, for researchers and journalists.",
            silence: "One place to watch many platforms for the same region." },
          { name: "X advanced search", url: "https://x.com/search-advanced", type: "tool", cost: "free", access: "registration", from: "meeting",
            what: "Search posts by place, language, date and account.",
            silence: "Compare this month's volume with past months for the same terms." }
        ]}
      ]
    },
    {
      name: "Check the silence", stage: 3,
      question: "Is something changing that reporting doesn't show?",
      who: "Tool, then person.",
      decide: "The tool sorts silence into quiet, unheard, or silent but changing. A person decides what to do about it.",
      children: [
        { name: "Satellite & fire", children: [
          { name: "NASA FIRMS", url: "https://firms.modaps.eosdis.nasa.gov", type: "tool", cost: "free", access: "open", from: "added",
            what: "Near-real-time fire detections from satellites.",
            silence: "New fires where no one is reporting can mean burned farmland or villages.",
            limits: "Can't tell a field burn from an attack. Clouds and small fires get missed." },
          { name: "Copernicus Browser", url: "https://browser.dataspace.copernicus.eu", type: "tool", cost: "free", access: "registration", from: "added",
            what: "Free Sentinel satellite imagery with before-and-after comparison.",
            silence: "Check whether a place looks different from last month.",
            limits: "10 m resolution: fields and burn scars, not individual buildings." },
          { name: "UNOSAT", url: "https://unosat.org", type: "source", cost: "free", access: "un", from: "added",
            what: "The UN Satellite Centre (UNITAR), which analyses imagery for UN agencies.",
            silence: "Can be asked to look where reporting has stopped." },
          { name: "Planet", url: "https://www.planet.com", type: "source", cost: "paid", access: "registration", from: "added",
            what: "Near-daily commercial satellite imagery at higher resolution.",
            silence: "Fine enough to see damage to buildings." }
        ]},
        { name: "Internet & connectivity", children: [
          { name: "IODA", url: "https://ioda.inetintel.cc.gatech.edu", type: "tool", cost: "free", access: "open", from: "concept",
            what: "Detects internet outages by country and region.",
            silence: "A region going offline explains silence, and is a warning sign itself." },
          { name: "Cloudflare Radar", url: "https://radar.cloudflare.com", type: "tool", cost: "free", access: "open", from: "added",
            what: "Traffic and outage data from Cloudflare's network.",
            silence: "A second check on outages, by country and network." },
          { name: "NetBlocks", url: "https://netblocks.org", type: "source", cost: "free", access: "open", from: "added",
            what: "Reports internet disruptions and shutdowns.",
            silence: "Often the first public report of a shutdown." },
          { name: "#KeepItOn", url: "https://www.accessnow.org/campaign/keepiton/", type: "source", cost: "free", access: "open", from: "concept",
            what: "Access Now's campaign and yearly dataset of government internet shutdowns.",
            silence: "Shows which governments have cut access before." }
        ]},
        { name: "People on the move", children: [
          { name: "IOM DTM", url: "https://dtm.iom.int", type: "source", cost: "free", access: "open", from: "added",
            what: "IOM's Displacement Tracking Matrix: where people are moving, and why.",
            silence: "People leaving a place no one is reporting on is a strong signal." },
          { name: "UNHCR data portal", url: "https://data.unhcr.org", type: "source", cost: "free", access: "open", from: "added",
            what: "Refugee and displacement figures by situation.",
            silence: "Arrivals elsewhere can show trouble at home." },
          { name: "IDMC", url: "https://www.internal-displacement.org", type: "source", cost: "free", access: "open", from: "added",
            what: "Internal Displacement Monitoring Centre: global data on displacement within countries.",
            silence: "Covers movement inside a country, which border data misses." }
        ]},
        { name: "Food & markets", children: [
          { name: "WFP HungerMap LIVE", url: "https://hungermap.wfp.org", type: "tool", cost: "free", access: "open", from: "added",
            what: "Near-real-time food security estimates by region.",
            silence: "Food access can change where nothing is being reported." },
          { name: "FEWS NET", url: "https://fews.net", type: "source", cost: "free", access: "open", from: "added",
            what: "Famine early warning analysis and food price data.",
            limits: "Was offline for months in 2025 during US aid cuts. Check it's current. A dataset the UN doesn't own, going dark." }
        ]},
        { name: "Ships & flights", children: [
          { name: "Global Fishing Watch", url: "https://globalfishingwatch.org", type: "tool", cost: "free", access: "open", from: "concept",
            what: "Maps vessel activity from ship tracking data.",
            silence: "Ships switching off their trackers (\"going dark\") show up as gaps." },
          { name: "MarineTraffic", url: "https://www.marinetraffic.com", type: "tool", cost: "freemium", access: "open", from: "added",
            what: "Live ship positions and port calls." },
          { name: "ADS-B Exchange", url: "https://globe.adsbexchange.com", type: "tool", cost: "free", access: "open", from: "added",
            what: "Unfiltered live flight tracking.",
            silence: "Flight activity that changes when nothing is being reported." }
        ]}
      ]
    },
    {
      name: "Verify what comes in", stage: 4,
      question: "Is this piece of content what it claims to be? If it's false, why was it made?",
      who: "Both.",
      decide: "The tools gather evidence about a piece of content. The analyst decides whether it can be used.",
      children: [
        { name: "Images & video", children: [
          { name: "InVID-WeVerify", url: "https://weverify.eu/verification-plugin/", type: "tool", cost: "free", access: "open", from: "kelly",
            what: "Browser plugin that breaks video into keyframes, runs reverse searches and reads metadata." },
          { name: "TinEye", url: "https://tineye.com", type: "tool", cost: "free", access: "open", from: "added",
            what: "Reverse image search: where else has this image appeared, and when first?" },
          { name: "Google Lens", url: "https://lens.google", type: "tool", cost: "free", access: "open", from: "added",
            what: "Reverse image search with Google's index." },
          { name: "Yandex Images", url: "https://yandex.com/images/", type: "tool", cost: "free", access: "open", from: "added",
            what: "Reverse image search that often finds matches the others miss." }
        ]},
        { name: "Place & time", children: [
          { name: "SunCalc", url: "https://www.suncalc.org", type: "tool", cost: "free", access: "open", from: "added",
            what: "Sun position for any place and time. Check shadows against the claimed time." },
          { name: "Overpass Turbo", url: "https://overpass-turbo.eu", type: "tool", cost: "free", access: "open", from: "added",
            what: "Query OpenStreetMap for features, like a mosque next to a river, to geolocate an image." },
          { name: "Mapillary", url: "https://www.mapillary.com", type: "tool", cost: "free", access: "open", from: "added",
            what: "Street-level imagery to match against footage." }
        ]},
        { name: "Provenance & capture", children: [
          { name: "Content Credentials", url: "https://verify.contentauthenticity.org", type: "tool", cost: "free", access: "open", from: "added",
            what: "Checks a file for C2PA provenance data: who made it, and how it was edited.",
            limits: "Most files carry no credentials yet." },
          { name: "Wayback Machine", url: "https://web.archive.org", type: "tool", cost: "free", access: "open", from: "added",
            what: "Archived copies of web pages over time.",
            silence: "Shows what a page said before it changed or vanished." },
          { name: "archive.today", url: "https://archive.ph", type: "tool", cost: "free", access: "open", from: "added",
            what: "On-demand snapshots of web pages." },
          { name: "Hunchly", url: "https://www.hunch.ly", type: "tool", cost: "paid", access: "registration", from: "added",
            what: "Captures every page you visit during an investigation." }
        ]},
        { name: "Fact-checks", children: [
          { name: "Fact Check Explorer", url: "https://toolbox.google.com/factcheck/explorer", type: "tool", cost: "free", access: "open", from: "added",
            what: "Google's search across published fact-checks." },
          { name: "Africa Check", url: "https://africacheck.org", type: "source", cost: "free", access: "open", from: "added",
            what: "Independent fact-checking organisation covering African countries." }
        ]},
        { name: "Toolkits & guides", children: [
          { name: "Bellingcat toolkit", url: "https://bellingcat.gitbook.io/toolkit", type: "source", cost: "free", access: "open", from: "kelly",
            what: "Bellingcat's directory of investigation tools, with notes on what each is good for." },
          { name: "Bellingcat how-tos", url: "https://www.bellingcat.com/category/resources/?fwp_categories=how-tos", type: "source", cost: "free", access: "open", from: "meeting",
            what: "Step-by-step guides from Bellingcat investigators." },
          { name: "OSINT Framework", url: "https://osintframework.com", type: "source", cost: "free", access: "open", from: "meeting",
            what: "The general OSINT directory this map is modelled on." },
          { name: "Verification Handbook", url: "https://datajournalism.com/read/handbook/verification-3", type: "source", cost: "free", access: "open", from: "added",
            what: "Guide for journalists and humanitarians on verifying digital content." }
        ]}
      ]
    },
    {
      name: "Carry it up", stage: 5,
      question: "How does what we don't know travel with the analysis to the envoy?",
      who: "Person.",
      decide: "The analyst asks someone closer, acts anyway, or records \"unknown,\" and says why.",
      children: [
        { name: "Record the gap", children: [
          { name: "Gap record", url: "../quiet-or-unheard/index.html", type: "practice", cost: "free", access: "open", from: "concept",
            what: "What the analysis rests on, where it's silent, what disagrees, and who could fill the gap.",
            silence: "Travels with the analysis to the envoy. People can add to it, not quietly delete it." },
          { name: "ACAPS gap method", url: "https://www.acaps.org/fileadmin/Technical_notes/20211207_acaps_humanitarian_access_methodology_note_december_2021.pdf", type: "source", cost: "free", access: "open", from: "concept",
            what: "ACAPS's method note: missing indicators are marked \"information gap\", not left blank." },
          { name: "Berkeley Protocol", url: "https://www.ohchr.org/en/publications/policy-and-methodological-publications/berkeley-protocol-digital-open-source", type: "source", cost: "free", access: "open", from: "added",
            what: "OHCHR and UC Berkeley's standard for digital open-source investigations.",
            silence: "A shared way to document how evidence was found, and what couldn't be found." }
        ]},
        { name: "Check with people", children: [
          { name: "Ask someone closer", type: "practice", cost: "free", access: "un", from: "concept",
            what: "Before deciding, ask someone closer to the place. Their answer goes in the gap record." },
          { name: "Regional member states", type: "practice", cost: "free", access: "un", from: "kelly",
            what: "Check with member states in the region, and watch what influential members are saying." }
        ]},
        { name: "Learn afterwards", children: [
          { name: "After-action check", type: "practice", cost: "free", access: "open", from: "concept",
            what: "Afterwards, check whether the silence hid something, and update what normal coverage looks like." }
        ]}
      ]
    },
    {
      name: "Case studies", stage: 6,
      question: "Where has silence been read as a signal before?",
      who: "Research (Ethan, Ani).",
      decide: "Each case is linked to the stage it illustrates.",
      children: [
        { name: "Silence read as a signal", children: [
          { name: "Zero reporting, Malawi", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6264833/", type: "case", illustrates: 2, from: "concept",
            went: "Clinics with no cases to report.",
            revealed: "Clinics must send a \"no cases\" report, so silence is never mistaken for health." },
          { name: "GeoGuard's missing category", url: "https://mptf.undp.org/sites/default/files/documents/2026-03/2024_dppa_geoguard_finalreport_narrative_0.pdf", type: "case", illustrates: 2, from: "concept",
            went: "Farmer-herder clashes.",
            revealed: "GeoGuard's conflict data (ACLED and UCDP) had no category for them, so they never appeared on the map." },
          { name: "Ships going dark", url: "https://www.civilbeat.org/2022/12/when-fishing-boats-go-dark-at-sea-theyre-often-committing-crimes-heres-where-its-happening/", type: "case", illustrates: 3, from: "concept",
            went: "Fishing vessels that switched off their trackers.",
            revealed: "Gaps in tracking data hid about 6% of global fishing activity." },
          { name: "Shutdown monitors", url: "https://blog.apnic.net/2024/09/11/ioda-internet-outage-detection-and-analysis/", type: "case", illustrates: 3, from: "concept",
            went: "Whole regions going offline.",
            revealed: "IODA and #KeepItOn treat a region going silent as a warning sign." },
          { name: "El Fasher, 2025", url: "https://www.newarab.com/news/new-satellite-images-suggest-mass-killings-persist-sudans-el-fasher", type: "case", illustrates: 3, from: "concept",
            went: "Reporting from the city, under a communications blackout.",
            revealed: "Satellite imagery documented what reporting couldn't." },
          { name: "The pharmacy run", type: "case", illustrates: 3, from: "kelly",
            went: "Nothing in the news.",
            revealed: "Field colleagues noticed foreign soldiers asking for pharmacies, stocking up before fighting. Told to us at the UN." },
          { name: "ACAPS information gaps", url: "https://www.acaps.org/fileadmin/Technical_notes/20211207_acaps_humanitarian_access_methodology_note_december_2021.pdf", type: "case", illustrates: 5, from: "concept",
            went: "Indicators with no data.",
            revealed: "ACAPS marks them \"information gap\" instead of leaving them blank." }
        ]},
        { name: "To research", children: [
          { name: "Tigray, 2020", type: "case", illustrates: 3, from: "added", status: "to research",
            went: "Communications blackout during the war.",
            revealed: "What filled the gap, and what was missed?" },
          { name: "Myanmar, 2021", type: "case", illustrates: 3, from: "added", status: "to research",
            went: "Internet shutdowns after the coup.",
            revealed: "How did outage monitors and diaspora networks fill in?" },
          { name: "Rakhine, 2017", type: "case", illustrates: 3, from: "added", status: "to research",
            went: "Access to northern Rakhine State.",
            revealed: "Satellite imagery showed burned villages. How did it move into UN analysis?" },
          { name: "Anglophone Cameroon", type: "case", illustrates: 2, from: "added", status: "to research",
            went: "Our map scenario.",
            revealed: "How is the crisis covered in local languages and on community radio?" }
        ]}
      ]
    }
  ]
};

/* ok = loaded on the date below. blocked = the site stopped an automated check; open it to confirm. */
window.LINK_CHECK = {
  date: "2026-10-29",
  results: {
    "https://www.crisisgroup.org/crisiswatch": "blocked",
    "https://reliefweb.int": "ok",
    "https://www.acaps.org": "ok",
    "https://www.securitycouncilreport.org": "blocked",
    "https://www.mediacloud.org": "ok",
    "https://radio.garden": "ok",
    "https://digitallibrary.un.org": "blocked",
    "https://peacemaker.un.org": "ok",
    "https://acleddata.com": "ok",
    "https://ucdp.uu.se": "ok",
    "https://www.gdeltproject.org": "ok",
    "https://monitoring.bbc.co.uk": "ok",
    "https://www.remesh.ai": "ok",
    "https://www.u-report.org": "ok",
    "https://www.ushahidi.com": "ok",
    "https://www.kobotoolbox.org": "ok",
    "https://tgstat.com": "ok",
    "https://core.telegram.org": "ok",
    "https://www.junkipedia.org": "ok",
    "https://x.com/search-advanced": "ok",
    "https://firms.modaps.eosdis.nasa.gov": "ok",
    "https://browser.dataspace.copernicus.eu": "ok",
    "https://unosat.org": "ok",
    "https://www.planet.com": "ok",
    "https://ioda.inetintel.cc.gatech.edu": "ok",
    "https://radar.cloudflare.com": "ok",
    "https://netblocks.org": "ok",
    "https://www.accessnow.org/campaign/keepiton/": "ok",
    "https://dtm.iom.int": "ok",
    "https://data.unhcr.org": "ok",
    "https://www.internal-displacement.org": "ok",
    "https://hungermap.wfp.org": "ok",
    "https://fews.net": "ok",
    "https://globalfishingwatch.org": "ok",
    "https://www.marinetraffic.com": "ok",
    "https://globe.adsbexchange.com": "ok",
    "https://data.humdata.org": "ok",
    "https://weverify.eu/verification-plugin/": "ok",
    "https://tineye.com": "ok",
    "https://lens.google": "ok",
    "https://yandex.com/images/": "ok",
    "https://www.suncalc.org": "ok",
    "https://overpass-turbo.eu": "ok",
    "https://www.mapillary.com": "ok",
    "https://verify.contentauthenticity.org": "ok",
    "https://web.archive.org": "ok",
    "https://archive.ph": "ok",
    "https://www.hunch.ly": "ok",
    "https://toolbox.google.com/factcheck/explorer": "ok",
    "https://africacheck.org": "blocked",
    "https://bellingcat.gitbook.io/toolkit": "ok",
    "https://www.bellingcat.com/category/resources/?fwp_categories=how-tos": "ok",
    "https://osintframework.com": "ok",
    "https://datajournalism.com/read/handbook/verification-3": "ok",
    "https://www.acaps.org/fileadmin/Technical_notes/20211207_acaps_humanitarian_access_methodology_note_december_2021.pdf": "ok",
    "https://www.ohchr.org/en/publications/policy-and-methodological-publications/berkeley-protocol-digital-open-source": "ok",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC6264833/": "ok",
    "https://mptf.undp.org/sites/default/files/documents/2026-03/2024_dppa_geoguard_finalreport_narrative_0.pdf": "ok",
    "https://www.civilbeat.org/2022/12/when-fishing-boats-go-dark-at-sea-theyre-often-committing-crimes-heres-where-its-happening/": "ok",
    "https://blog.apnic.net/2024/09/11/ioda-internet-outage-detection-and-analysis/": "ok",
    "https://www.newarab.com/news/new-satellite-images-suggest-mass-killings-persist-sudans-el-fasher": "ok",
    "https://scholar.google.com": "ok",
    "https://www.ajol.info": "ok",
    "https://www.jstor.org": "ok",
    "https://www.un.org/en/library": "ok"
  },
  // Links added after the main check, with the day each was checked.
  dates: {
    "https://scholar.google.com": "2026-10-30",
    "https://www.ajol.info": "2026-10-30",
    "https://www.jstor.org": "2026-10-30",
    "https://www.un.org/en/library": "2026-10-30"
  }
};
