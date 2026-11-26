// ==========================================================
// NAMN, KONTAKT OCH ADRESS – byt här, på ett ställe.
// Kör sedan:  node tools/gen.js   (och  node tools/og.js  för delningsbilden)
//
// Ett värde som är tomt eller börjar med "[" räknas som ej ifyllt:
//   - efternamn: sidan visar bara "Victor"
//   - epost / linkedin: raden visas inte alls på sidan
// ==========================================================
module.exports = {
  person: {
    fornamn: 'Victor',
    efternamn: '[EFTERNAMN]',
    epost: '[E-POST]',        // t.ex. namn@doman.se
    linkedin: '[LINKEDIN]',   // hel adress, t.ex. https://www.linkedin.com/in/namn
    ort: 'Dalarna',
  },
  // Sidans publika adress (canonical, og:url, sitemap). Avsluta med /.
  // Byt till den egna domänen när den finns, t.ex. 'https://www.namn.se/'.
  url: 'https://vfalk-ncc.github.io/Portfolio/',
};
