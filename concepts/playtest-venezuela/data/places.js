// DEMO DATA for the Map view on screen 5. Not part of the scraped catalog.
// Each source is placed at its outlet's home city, filled in by hand for the concept and NOT verified.
// Social posts and accounts with no known base are left out on purpose: the map shows them as
// "Location not recorded" so the gap stays visible. Replace this file once the real scraper
// records where each source is based.
(function (root) {
  // [longitude, latitude]
  var CITY = {
    'Washington': [-77.04, 38.9], 'New York': [-74.0, 40.71], 'Los Angeles': [-118.24, 34.05],
    'Miami': [-80.19, 25.76], 'Stanford': [-122.17, 37.43], 'Toronto': [-79.38, 43.65],
    'London': [-0.13, 51.51], 'Cambridge (UK)': [0.12, 52.2], 'Paris': [2.35, 48.86], 'Amsterdam': [4.9, 52.37],
    'Doha': [51.53, 25.29], 'Kathmandu': [85.32, 27.72], 'Kuala Lumpur': [101.69, 3.14],
    'Sydney': [151.21, -33.87], 'Wellington': [174.78, -41.29],
    'Mexico City': [-99.13, 19.43], 'Caracas': [-66.9, 10.48], 'Montevideo': [-56.16, -34.9], 'Buenos Aires': [-58.38, -34.6]
  };
  var SOURCE_CITY = {
    'pbs-ap': 'Washington', 'fox5-ap': 'Washington', 'fox-live': 'New York', 'fox-100': 'New York',
    'bbc-video': 'London', 'bbc-spies': 'London', 'about-that': 'Toronto', 'afp-factcheck': 'Paris',
    'cbs-images': 'New York', 'cbs-satellite': 'New York', 'state-crisis': 'Washington',
    'un-news': 'New York', 'un-live': 'New York', 'npr-un': 'Washington', 'npr-machado': 'Washington',
    'csis-imagery': 'Washington', 'bellingcat': 'Amsterdam', 'cambridge': 'Cambridge (UK)',
    'cfr-noriega': 'New York', 'chatham': 'London', 'stanford': 'Stanford', 'justsecurity': 'New York',
    'mercopress': 'Montevideo', 'monitor-victimas': 'Caracas', 'razon-cabello': 'Mexico City',
    'democracynow': 'New York', 'eldiario-testimonios': 'Caracas', 'eldiario-sntp': 'Caracas',
    'elnacional-sntp': 'Caracas', 'infobae-press': 'Buenos Aires', 'breitbart-press': 'Los Angeles',
    'aljazeera-delcy': 'Doha', 'telemundo-court': 'Miami', 'amny-court': 'New York',
    'ekantipur-media': 'Kathmandu', 'rollcall': 'Washington', 'star-senate': 'Kuala Lumpur',
    'rnz-afp': 'Wellington', 'aap-factcheck': 'Sydney', 'chequeado': 'Buenos Aires'
  };
  // Places the analyst can type in "Where" on screen 1, so the map can mark them
  var SCOPE = { 'venezuela': [-66.6, 7.5], 'caracas': CITY['Caracas'], 'new york': CITY['New York'] };

  root.DEMO_PLACES = {
    of: function (id) {
      var city = SOURCE_CITY[id];
      return city ? { name: city, lon: CITY[city][0], lat: CITY[city][1] } : null;
    },
    scope: function (tokens) {
      return (tokens || []).map(function (t) {
        var c = SCOPE[String(t).toLowerCase().trim()];
        return c ? { name: t, lon: c[0], lat: c[1] } : null;
      }).filter(Boolean);
    }
  };
})(window);
