// The "phonebook": every source and tool Algorithm 1 can crawl, with the tags it filters on.
//
// kind      source (counts toward the 7 classes) | tool (verification / analysis toolkit, listed separately)
// cls       traditional | local | regional | un | academic | satellite | ground
// geo       'global', a country code ('CM'), a region ('CM:NW') or a bloc ('bloc:east-africa')
// issues    issue classes covered: conflict | protest | other | all
// languages ISO-ish codes it publishes in. '*' = user-generated, any language (not indexed, so it never closes a language gap)
// cost      free | freemium | paid
// access    open | credentialed (login / registration) | un-internal
// status    active (default) | reduced: still listed but not counted toward class coverage
// search    optional deep-link template: {q} query, {since} YYYY-MM-DD, {sinceCompact} YYYYMMDDHHMMSS
//
// Tags describe a source; they are not a judgement of it. Status entries marked mock are invented for testing.
(function (root) {
  root.PHONEBOOK = [
    // --- Traditional media ---
    { id: 'reuters', name: 'Reuters', url: 'https://www.reuters.com', kind: 'source', cls: 'traditional', platform: 'wire',
      geo: ['global'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'commercial' },
    { id: 'ap', name: 'Associated Press', url: 'https://apnews.com', kind: 'source', cls: 'traditional', platform: 'wire',
      geo: ['global'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'nonprofit cooperative' },
    { id: 'bbc', name: 'BBC News', url: 'https://www.bbc.com/news', kind: 'source', cls: 'traditional', platform: 'broadcast',
      geo: ['global'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'public broadcaster (UK)' },
    { id: 'aje', name: 'Al Jazeera', url: 'https://www.aljazeera.com', kind: 'source', cls: 'traditional', platform: 'broadcast',
      geo: ['global'], issues: ['all'], languages: ['en', 'ar'], cost: 'free', access: 'open', affiliation: 'state-funded (Qatar)' },
    { id: 'france24', name: 'France 24', url: 'https://www.france24.com', kind: 'source', cls: 'traditional', platform: 'broadcast',
      geo: ['global'], issues: ['all'], languages: ['en', 'fr', 'ar'], cost: 'free', access: 'open', affiliation: 'state-funded (France)' },
    { id: 'wsj', name: 'The Wall Street Journal', url: 'https://www.wsj.com', kind: 'source', cls: 'traditional', platform: 'news site',
      geo: ['global'], issues: ['all'], languages: ['en'], cost: 'paid', access: 'credentialed', affiliation: 'commercial' },
    { id: 'gdelt', name: 'GDELT Project', url: 'https://www.gdeltproject.org', kind: 'source', cls: 'traditional', platform: 'dataset',
      geo: ['global'], issues: ['all'], languages: ['*'], cost: 'free', access: 'open', affiliation: 'independent research',
      note: 'Machine-coded world news monitoring. Good for spotting a drop in coverage volume.',
      search: 'https://api.gdeltproject.org/api/v2/doc/doc?query={q}&mode=artlist&format=html&startdatetime={sinceCompact}' },

    // --- Regional media ---
    { id: 'africanews', name: 'Africanews', url: 'https://www.africanews.com', kind: 'source', cls: 'regional', platform: 'broadcast',
      geo: ['bloc:africa'], issues: ['all'], languages: ['en', 'fr'], cost: 'free', access: 'open', affiliation: 'commercial' },
    { id: 'jeuneafrique', name: 'Jeune Afrique', url: 'https://www.jeuneafrique.com', kind: 'source', cls: 'regional', platform: 'news site',
      geo: ['bloc:africa'], issues: ['all'], languages: ['fr'], cost: 'freemium', access: 'open', affiliation: 'commercial' },
    { id: 'eastafrican', name: 'The East African', url: 'https://www.theeastafrican.co.ke', kind: 'source', cls: 'regional', platform: 'news site',
      geo: ['bloc:east-africa'], issues: ['all'], languages: ['en'], cost: 'freemium', access: 'open', affiliation: 'commercial (Nation Media Group)' },
    { id: 'bbcpidgin', name: 'BBC News Pidgin', url: 'https://www.bbc.com/pidgin', kind: 'source', cls: 'regional', platform: 'broadcast',
      geo: ['NG', 'CM', 'GH'], issues: ['all'], languages: ['pcm'], cost: 'free', access: 'open', affiliation: 'public broadcaster (UK)',
      note: 'Nigerian Pidgin. Close to, but not the same as, Cameroonian Pidgin.' },
    { id: 'bbcswahili', name: 'BBC News Swahili', url: 'https://www.bbc.com/swahili', kind: 'source', cls: 'regional', platform: 'broadcast',
      geo: ['bloc:east-africa'], issues: ['all'], languages: ['sw'], cost: 'free', access: 'open', affiliation: 'public broadcaster (UK)' },
    { id: 'bbcafrique', name: 'BBC News Afrique', url: 'https://www.bbc.com/afrique', kind: 'source', cls: 'regional', platform: 'broadcast',
      geo: ['bloc:central-africa', 'bloc:west-africa'], issues: ['all'], languages: ['fr'], cost: 'free', access: 'open', affiliation: 'public broadcaster (UK)' },

    // --- Local media ---
    { id: 'mmi', name: 'Mimi Mefo Info', url: 'https://mimimefoinfos.com', kind: 'source', cls: 'local', platform: 'news site',
      geo: ['CM', 'CM:NW', 'CM:SW'], issues: ['all'], languages: ['en', 'fr'], cost: 'free', access: 'open', affiliation: 'independent' },
    { id: 'guardianpost', name: 'The Guardian Post (Cameroon)', url: 'https://theguardianpostcameroon.com', kind: 'source', cls: 'local', platform: 'news site',
      geo: ['CM:NW', 'CM:SW'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'independent',
      status: 'reduced', statusNote: 'Mock: correspondents in the Northwest have stopped filing.' },
    { id: 'camtribune', name: 'Cameroon Tribune', url: 'https://www.cameroon-tribune.cm', kind: 'source', cls: 'local', platform: 'news site',
      geo: ['CM'], issues: ['all'], languages: ['fr', 'en'], cost: 'freemium', access: 'open', affiliation: 'state-owned' },
    { id: 'premiumtimes', name: 'Premium Times', url: 'https://www.premiumtimesng.com', kind: 'source', cls: 'local', platform: 'news site',
      geo: ['NG'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'independent' },
    { id: 'nation', name: 'Daily Nation', url: 'https://nation.africa/kenya', kind: 'source', cls: 'local', platform: 'news site',
      geo: ['KE', 'KE:NBI', 'KE:MSA', 'KE:KSM', 'KE:NKR'], issues: ['all'], languages: ['en'], cost: 'freemium', access: 'open', affiliation: 'commercial (Nation Media Group)' },
    { id: 'standard', name: 'The Standard', url: 'https://www.standardmedia.co.ke', kind: 'source', cls: 'local', platform: 'news site',
      geo: ['KE'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'commercial' },
    { id: 'taifaleo', name: 'Taifa Leo', url: 'https://taifaleo.nation.co.ke', kind: 'source', cls: 'local', platform: 'news site',
      geo: ['KE'], issues: ['all'], languages: ['sw'], cost: 'freemium', access: 'open', affiliation: 'commercial (Nation Media Group)' },
    { id: 'kbc', name: 'Kenya Broadcasting Corporation', url: 'https://www.kbc.co.ke', kind: 'source', cls: 'local', platform: 'broadcast',
      geo: ['KE'], issues: ['all'], languages: ['en', 'sw'], cost: 'free', access: 'open', affiliation: 'state-owned' },
    { id: 'dabanga', name: 'Radio Dabanga', url: 'https://www.dabangasudan.org', kind: 'source', cls: 'local', platform: 'broadcast',
      geo: ['SD', 'SD:WD', 'SD:ND'], issues: ['all'], languages: ['ar', 'en'], cost: 'free', access: 'open', affiliation: 'independent (diaspora-based)' },
    { id: 'sudantribune', name: 'Sudan Tribune', url: 'https://sudantribune.com', kind: 'source', cls: 'local', platform: 'news site',
      geo: ['SD'], issues: ['all'], languages: ['en', 'ar'], cost: 'free', access: 'open', affiliation: 'independent (diaspora-based)' },
    { id: 'darfur24', name: 'Darfur 24', url: 'https://www.darfur24.com', kind: 'source', cls: 'local', platform: 'news site',
      geo: ['SD:WD', 'SD:ND'], issues: ['all'], languages: ['ar'], cost: 'free', access: 'open', affiliation: 'independent',
      status: 'reduced', statusNote: 'Mock: publishing has dropped to a few items a week.' },

    // --- UN / institutional ---
    { id: 'reliefweb', name: 'ReliefWeb (OCHA)', url: 'https://reliefweb.int', kind: 'source', cls: 'un', platform: 'archive',
      geo: ['global'], issues: ['all'], languages: ['en', 'fr', 'es', 'ar'], cost: 'free', access: 'open', affiliation: 'UN',
      search: 'https://reliefweb.int/updates?search={q}' },
    { id: 'hdx', name: 'Humanitarian Data Exchange (OCHA)', url: 'https://data.humdata.org', kind: 'source', cls: 'un', platform: 'dataset',
      geo: ['global'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'UN',
      search: 'https://data.humdata.org/search?q={q}' },
    { id: 'undl', name: 'UN Digital Library', url: 'https://digitallibrary.un.org', kind: 'source', cls: 'un', platform: 'archive',
      geo: ['global'], issues: ['all'], languages: ['en', 'fr', 'es', 'ar', 'ru', 'zh'], cost: 'free', access: 'open', affiliation: 'UN',
      note: 'Resolutions, reports of the Secretary-General, meeting records.' },
    { id: 'unsitreps', name: 'UN field situation reports', url: '', kind: 'source', cls: 'un', platform: 'internal reports',
      geo: ['global'], issues: ['all'], languages: ['en', 'fr'], cost: 'free', access: 'un-internal', affiliation: 'UN',
      note: 'Placeholder for DPPA/DPO internal reporting. Not a real link.' },
    { id: 'scr', name: 'Security Council Report', url: 'https://www.securitycouncilreport.org', kind: 'source', cls: 'un', platform: 'news site',
      geo: ['global'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'independent (non-UN)' },

    // --- Academic / research ---
    { id: 'crisisgroup', name: 'International Crisis Group', url: 'https://www.crisisgroup.org', kind: 'source', cls: 'academic', platform: 'reports',
      geo: ['global'], issues: ['conflict', 'other'], languages: ['en', 'fr'], cost: 'free', access: 'open', affiliation: 'NGO' },
    { id: 'ucdp', name: 'UCDP (Uppsala Conflict Data Program)', url: 'https://ucdp.uu.se', kind: 'source', cls: 'academic', platform: 'dataset',
      geo: ['global'], issues: ['conflict'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'academic (Uppsala University)' },
    { id: 'acled', name: 'ACLED', url: 'https://acleddata.com', kind: 'source', cls: 'academic', platform: 'dataset',
      geo: ['global'], issues: ['conflict', 'protest'], languages: ['en'], cost: 'free', access: 'credentialed', affiliation: 'NGO',
      note: 'Free with registration. Event-level political violence and protest data.' },
    { id: 'jstor', name: 'JSTOR', url: 'https://www.jstor.org', kind: 'source', cls: 'academic', platform: 'journal',
      geo: ['global'], issues: ['all'], languages: ['en'], cost: 'paid', access: 'credentialed', affiliation: 'nonprofit' },
    { id: 'africanarguments', name: 'African Arguments', url: 'https://africanarguments.org', kind: 'source', cls: 'academic', platform: 'reports',
      geo: ['bloc:africa'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'independent (Royal African Society)' },

    // --- Satellite / OSINT ---
    { id: 'firms', name: 'NASA FIRMS (fire detection)', url: 'https://firms.modaps.eosdis.nasa.gov/map/', kind: 'source', cls: 'satellite', platform: 'satellite imagery',
      geo: ['global'], issues: ['conflict', 'other'], languages: [], cost: 'free', access: 'open', affiliation: 'government (US)',
      note: 'Active fire hotspots. Burned villages and farmland show up here before they show up in the news.' },
    { id: 'copernicus', name: 'Copernicus Browser (Sentinel)', url: 'https://browser.dataspace.copernicus.eu', kind: 'source', cls: 'satellite', platform: 'satellite imagery',
      geo: ['global'], issues: ['all'], languages: [], cost: 'free', access: 'credentialed', affiliation: 'government (EU)' },
    { id: 'planet', name: 'Planet', url: 'https://www.planet.com', kind: 'source', cls: 'satellite', platform: 'satellite imagery',
      geo: ['global'], issues: ['all'], languages: [], cost: 'paid', access: 'credentialed', affiliation: 'commercial' },
    { id: 'unosat', name: 'UNOSAT', url: 'https://unosat.org', kind: 'source', cls: 'satellite', platform: 'satellite imagery',
      geo: ['global'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'UN' },

    // --- Ground communications ---
    { id: 'x', name: 'X (advanced search)', url: 'https://x.com/search-advanced', kind: 'source', cls: 'ground', platform: 'x',
      geo: ['global'], issues: ['all'], languages: ['*'], cost: 'free', access: 'credentialed', affiliation: 'platform',
      search: 'https://x.com/search?q={q}%20since%3A{since}&f=live' },
    { id: 'telegram', name: 'Telegram public channels (via TGStat)', url: 'https://tgstat.com', kind: 'source', cls: 'ground', platform: 'telegram',
      geo: ['global'], issues: ['all'], languages: ['*'], cost: 'freemium', access: 'open', affiliation: 'platform',
      note: 'Some channels are red herrings. Check who runs a channel before reading it as ground truth.' },
    { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com', kind: 'source', cls: 'ground', platform: 'youtube',
      geo: ['global'], issues: ['all'], languages: ['*'], cost: 'free', access: 'open', affiliation: 'platform',
      search: 'https://www.youtube.com/results?search_query={q}' },
    { id: 'facebook', name: 'Facebook public pages and groups', url: 'https://www.facebook.com', kind: 'source', cls: 'ground', platform: 'facebook',
      geo: ['global'], issues: ['all'], languages: ['*'], cost: 'free', access: 'credentialed', affiliation: 'platform' },
    { id: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com', kind: 'source', cls: 'ground', platform: 'tiktok',
      geo: ['global'], issues: ['all'], languages: ['*'], cost: 'free', access: 'open', affiliation: 'platform' },
    { id: 'remesh', name: 'Remesh digital dialogues', url: 'https://www.remesh.ai', kind: 'source', cls: 'ground', platform: 'consultation',
      geo: ['global'], issues: ['all'], languages: ['*'], cost: 'paid', access: 'un-internal', affiliation: 'commercial (UN partner)',
      note: 'Anonymous, low-bandwidth consultation. Needs a facilitator who speaks the local language.' },
    { id: 'fieldcolleagues', name: 'Field colleagues (WhatsApp / Signal)', url: '', kind: 'source', cls: 'ground', platform: 'messaging',
      geo: ['CM', 'KE', 'SD'], issues: ['all'], languages: ['*'], cost: 'free', access: 'un-internal', affiliation: 'UN',
      note: 'Mock: countries where the team has field contacts.' },
    { id: 'ushahidi', name: 'Ushahidi deployments', url: 'https://www.ushahidi.com', kind: 'source', cls: 'ground', platform: 'crowdmap',
      geo: ['global'], issues: ['all'], languages: ['*'], cost: 'freemium', access: 'open', affiliation: 'nonprofit' },

    // --- Verification / analysis toolkit (shown separately, never counted toward classes) ---
    { id: 'bellingcat', name: 'Bellingcat Online Investigations Toolkit', url: 'https://bellingcat.gitbook.io/toolkit', kind: 'tool', platform: 'directory',
      geo: ['global'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'independent',
      useFor: 'Finding the right tool for a verification task, with how-to guides.' },
    { id: 'osintframework', name: 'OSINT Framework', url: 'https://osintframework.com', kind: 'tool', platform: 'directory',
      geo: ['global'], issues: ['all'], languages: ['en'], cost: 'free', access: 'open', affiliation: 'independent',
      useFor: 'Tree of OSINT resources by data type.' },
    { id: 'invid', name: 'InVID-WeVerify plugin', url: 'https://weverify.eu/verification-plugin/', kind: 'tool', platform: 'browser plugin',
      geo: ['global'], issues: ['all'], languages: ['en', 'fr', 'ar'], cost: 'free', access: 'open', affiliation: 'EU-funded research',
      useFor: 'Video keyframes, reverse image search, metadata.' },
    { id: 'wayback', name: 'Wayback Machine', url: 'https://web.archive.org', kind: 'tool', platform: 'archive',
      geo: ['global'], issues: ['all'], languages: ['*'], cost: 'free', access: 'open', affiliation: 'nonprofit',
      useFor: 'Seeing a page before it was edited or taken down.' },
    { id: 'tineye', name: 'TinEye', url: 'https://tineye.com', kind: 'tool', platform: 'reverse image',
      geo: ['global'], issues: ['all'], languages: ['en'], cost: 'freemium', access: 'open', affiliation: 'commercial',
      useFor: 'Finding where an image first appeared.' }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
