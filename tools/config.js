// ==========================================================
// ALLT SOM ÄR PERSONLIGT ELLER ADRESS – byt här, på ett ställe.
// Kör sedan:  node tools/gen.js   (och  node tools/og.js  för delningsbilden)
// Värden som börjar med "[" visas som diskreta platshållare.
// ==========================================================
module.exports = {
  person: {
    efternamn: '[EFTERNAMN]',
    epost: '[E-POST]',        // t.ex. namn@doman.se
    linkedin: '[LINKEDIN]',   // hel adress, t.ex. https://www.linkedin.com/in/namn
  },
  // Sidans publika adress (canonical, og:url, og:image). Avsluta med /.
  url: 'https://vfalk-ncc.github.io/Portfolio/',
};
