// Geography the scope is built from: regions, the languages spoken there, bordering states and regional blocs.
// "Auto-derive from scope" reads everything here so the analyst only has to pick country, region and issue.
// Language lists are a starting point for the mock scenarios, not a complete census. The analyst can override them.
(function (root) {
  root.GEO = {
    countries: {
      CM: {
        name: 'Cameroon',
        officialLanguages: [{ code: 'en', name: 'English' }, { code: 'fr', name: 'French' }],
        blocs: ['africa', 'central-africa'],
        borders: ['NG', 'TD', 'CF', 'GQ', 'GA', 'CG'],
        regions: {
          NW: { name: 'Northwest', languages: [
            { code: 'wes', name: 'Cameroonian Pidgin English', related: ['pcm'] },
            { code: 'nso', name: "Lamnso'" }
          ] },
          SW: { name: 'Southwest', languages: [
            { code: 'wes', name: 'Cameroonian Pidgin English', related: ['pcm'] },
            { code: 'bri', name: 'Mokpwe (Bakweri)' }
          ] },
          FN: { name: 'Far North', languages: [
            { code: 'ff', name: 'Fulfulde' },
            { code: 'shu', name: 'Chadian (Shuwa) Arabic', related: ['ar'] }
          ] },
          CE: { name: 'Centre', languages: [{ code: 'ewo', name: 'Ewondo' }] },
          LT: { name: 'Littoral', languages: [{ code: 'dua', name: 'Duala' }] }
        }
      },
      KE: {
        name: 'Kenya',
        officialLanguages: [{ code: 'en', name: 'English' }, { code: 'sw', name: 'Swahili' }],
        blocs: ['africa', 'east-africa'],
        borders: ['ET', 'SO', 'SS', 'UG', 'TZ'],
        regions: {
          NBI: { name: 'Nairobi', languages: [{ code: 'sheng', name: 'Sheng', related: ['sw'] }] },
          MSA: { name: 'Mombasa', languages: [] },
          KSM: { name: 'Kisumu', languages: [{ code: 'luo', name: 'Dholuo' }] },
          NKR: { name: 'Nakuru', languages: [{ code: 'ki', name: 'Kikuyu' }, { code: 'kln', name: 'Kalenjin' }] }
        }
      },
      SD: {
        name: 'Sudan',
        officialLanguages: [{ code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }],
        blocs: ['africa', 'east-africa', 'arab-world'],
        borders: ['EG', 'LY', 'TD', 'CF', 'SS', 'ET', 'ER'],
        regions: {
          KH: { name: 'Khartoum', languages: [] },
          WD: { name: 'West Darfur', languages: [{ code: 'mls', name: 'Masalit' }, { code: 'fvr', name: 'Fur' }] },
          ND: { name: 'North Darfur', languages: [{ code: 'fvr', name: 'Fur' }, { code: 'zag', name: 'Zaghawa' }] },
          SK: { name: 'South Kordofan', languages: [] }
        }
      },
      NG: {
        name: 'Nigeria',
        officialLanguages: [{ code: 'en', name: 'English' }],
        blocs: ['africa', 'west-africa'],
        borders: ['CM', 'TD', 'NE', 'BJ'],
        regions: {}
      }
    },

    // Display names for bordering states that have no full record yet
    names: {
      CM: 'Cameroon', KE: 'Kenya', SD: 'Sudan', NG: 'Nigeria', TD: 'Chad', CF: 'Central African Republic',
      GQ: 'Equatorial Guinea', GA: 'Gabon', CG: 'Republic of the Congo', ET: 'Ethiopia', SO: 'Somalia',
      SS: 'South Sudan', UG: 'Uganda', TZ: 'Tanzania', EG: 'Egypt', LY: 'Libya', ER: 'Eritrea', NE: 'Niger',
      BJ: 'Benin', GH: 'Ghana'
    },

    // Names for language codes used by phonebook sources but not listed under any region
    languageNames: {
      en: 'English', fr: 'French', ar: 'Arabic', sw: 'Swahili', es: 'Spanish', ru: 'Russian', zh: 'Chinese',
      pcm: 'Nigerian Pidgin', '*': 'Any (user-generated)'
    },

    // Issue types the analyst picks from. A1 maps each one to an issue class.
    issueTypes: [
      { id: 'armed-conflict', label: 'Armed conflict', issueClass: 'conflict', keyword: 'conflict' },
      { id: 'intercommunal', label: 'Intercommunal violence', issueClass: 'conflict', keyword: 'violence' },
      { id: 'insurgency', label: 'Insurgency / separatist violence', issueClass: 'conflict', keyword: 'separatist' },
      { id: 'protest', label: 'Protest / demonstration', issueClass: 'protest', keyword: 'protest' },
      { id: 'civil-unrest', label: 'Civil unrest', issueClass: 'protest', keyword: 'unrest' },
      { id: 'strike', label: 'Strike / labour action', issueClass: 'protest', keyword: 'strike' },
      { id: 'election', label: 'Election crisis', issueClass: 'other', keyword: 'election' },
      { id: 'displacement', label: 'Displacement', issueClass: 'other', keyword: 'displaced' },
      { id: 'other', label: 'Other', issueClass: 'other', keyword: '' }
    ],

    // Documented disruptions to access (internet shutdowns, platform blocks).
    // `affects` lists the source classes that lose reach while the event is ongoing.
    // Events marked mock are invented for testing the gap logic and are labelled as such in the UI.
    // Real events carry a `ref` so the analyst can check them; dates are absolute, mock dates are relative to today.
    accessEvents: [
      { country: 'CM', regions: ['NW', 'SW'], start: '2017-01-17', end: '2017-04-20', affects: ['ground', 'local'],
        note: 'Internet shutdown in the Anglophone regions, about 93 days.', ref: 'https://www.accessnow.org/keepiton/' },
      { country: 'CM', regions: ['NW'], startDaysAgo: 60, end: null, affects: ['ground'], mock: true,
        note: 'Mobile data throttled in Bui division since an armed clash.' },
      { country: 'KE', regions: null, start: '2024-06-25', end: '2024-06-25', affects: ['ground'],
        note: 'Internet disruption reported during the Finance Bill protests.', ref: 'https://netblocks.org/' },
      { country: 'SD', regions: ['WD', 'ND'], startDaysAgo: 45, end: null, affects: ['ground'], mock: true,
        note: 'Telecom outage across Darfur; only satellite links working.' }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
