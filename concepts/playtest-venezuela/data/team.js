// SIMULATED teammates for the playtest. Nobody here is real and nothing syncs: this file stands in for
// what colleagues working the same scenario would have left behind, so the workspace can show how
// shared notes and connections might look. Replace with a real shared store later.
(function (root) {
  root.TEAM = {
    // color: one of the --cat-N category colours, so teammates read as distinct without new tokens
    members: {
      ao: { name: 'Amara O.', initials: 'AO', role: 'Desk officer', color: 'var(--cat-4)', active: 'Active 12 min ago' },
      lf: { name: 'Luis F.', initials: 'LF', role: 'Field adviser, Caracas', color: 'var(--cat-3)', active: 'Active 2 h ago' },
      mt: { name: 'Mei T.', initials: 'MT', role: 'Verification analyst', color: 'var(--cat-2)', active: 'Active yesterday' }
    },
    // Notes a teammate left on a source. `source` is a catalog id.
    notes: [
      { id: 'tn-1', by: 'ao', source: 'fox-live', at: 'Jan 14, 10:20', text: 'Useful as a timeline of official reactions. It was edited for nine days after the event, so quote the timestamped posts, not the page as a whole.' },
      { id: 'tn-2', by: 'mt', source: 'fox-live', at: 'Jan 14, 11:05', text: 'The Cuban casualty figure here is the Cuban government\'s own. I have not found it confirmed anywhere else.' },
      { id: 'tn-3', by: 'lf', source: 'eldiario-testimonios', at: 'Jan 13, 16:40', text: 'These accounts match what residents near Fuerte Tiuna told our office. Names are pseudonyms at their request; please keep them that way in anything we circulate.' },
      { id: 'tn-4', by: 'mt', source: 'post-ai-custody', at: 'Jan 13, 09:15', text: 'Three fact-checkers independently call this AI-generated. Do not use the image, even as illustration.' },
      { id: 'tn-5', by: 'ao', source: 'fox-100', at: 'Jan 14, 09:50', text: 'The figure of 100 comes from Cabello. Compare with the Monitor de Víctimas tally before it goes in the brief.' },
      { id: 'tn-6', by: 'lf', source: 'monitor-victimas', at: 'Jan 14, 12:30', text: 'This tally is compiled locally from incident reports. It is the closest thing to an independent count we have, and it is still incomplete outside Caracas.' },
      { id: 'tn-7', by: 'mt', source: 'bellingcat', at: 'Jan 12, 18:00', text: 'Method is documented step by step and the imagery is linked. I could reproduce the geolocation.' },
      { id: 'tn-8', by: 'ao', source: 'un-news', at: 'Jan 13, 14:10', text: 'This is the Secretary-General\'s position as published. Use it for the UN line; it does not describe events on the ground.' },
      { id: 'tn-9', by: 'lf', source: 'pbs-ap', at: 'Jan 12, 08:30', text: 'Wire copy filed within hours. Early details changed later, so check anything specific against a later source.' },
      { id: 'tn-10', by: 'mt', source: 'cbs-images', at: 'Jan 13, 10:00', text: 'Good overview of which viral images are altered. Pair it with the AFP and AAP checks for the individual posts.' }
    ],
    // Connections a teammate drew. They show on the map when both sources are on it.
    edges: [
      { id: 'team-e1', by: 'ao', a: 'fox-100', b: 'monitor-victimas', rel: 'Different figures', note: '100 (Cabello) against the monitor\'s lower running tally.' },
      { id: 'team-e2', by: 'mt', a: 'cbs-images', b: 'post-ai-custody', rel: 'Checks this', note: 'CBS lists this image among the altered ones.' },
      { id: 'team-e3', by: 'lf', a: 'eldiario-testimonios', b: 'fox-live', rel: 'Same event', note: 'Residents\' accounts of the night the live blog covers from Washington.' }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
