// ==========================================================
// STATUS PER VERKTYG – det enda stället att ändra status.
// Kör sedan:  node tools/gen.js
//
// Tillåtna värden (skrivs exakt så här):
//   'drift'       I DRIFT           används i det löpande arbetet
//   'utveckling'  UNDER UTVECKLING  fungerar, byggs ut
//   'prototyp'    PROTOTYP          fungerande prototyp
//   'pagang'      PÅ GÅNG           påbörjat, inte klart att visa
//
// Nyckeln är verktygets id i tools/data/verktyg.js.
// ==========================================================
module.exports = {
  'tidplan-i-modellen': 'drift',
  'fore-efter': 'drift',
  'trimble-connect': 'utveckling',
  'binderbuilder': 'utveckling',
  '4d-planeringsappen': 'utveckling',
  'production-cockpit': 'prototyp',
  'punktmolnsvisare': 'prototyp',
  'sharepoint-spegel': 'prototyp',
  'planeringskoll-4d': 'prototyp',
  'ritningsregister': 'prototyp',
  'produktionsplanering': 'utveckling',
  'motesprotokoll': 'pagang',
};
