import { resolveTeamLogo } from '../src/core/stats/logoResolver.ts';

const teams = [
  'Numancia', 'Real Oviedo', 'Peña Sport', 'Huesca', 'At. Baleares', 'Eldense',
  'Atlético Calatayud', 'Osasuna', 'Coruxo', 'Zamora', 'Lebrijana', 'Getafe',
  'Poblense', 'AD Ceuta', 'San Sebastián de los Reyes', 'CD Coria', 'Cieza',
  'Granada', 'Antequera', 'Águilas FC', 'Conquense', 'Castellón', 'Covadonga',
  'Real Valladolid', 'Guijuelo', 'Real Sporting', 'Laredo', 'Burgos CF',
  'Mijas Las Lagunas', 'Real Jaén', 'Real Ávila', 'Unionistas', 'Varea',
  'Andorra', 'Gimnástica T.', 'UD Ourense', 'Auriense', 'Deportivo de A Coruña',
  'Prat', 'Athletic Club', 'Ribadesella CF', 'R. Racing Club', 'Sporting Hortaleza',
  'Sevilla', 'Xerez CD', 'Cádiz', 'Liverpool', 'Chelsea', 'Everton',
  'Newcastle', 'Frosinone', 'Lecce', 'Fiorentina', 'Atalanta'
];

const missing = [];
for (const t of teams) {
  const logo = resolveTeamLogo(t, 'football');
  if (!logo) missing.push(t);
  else console.log('FOUND:', t, '=>', logo);
}

console.log('MISSING COUNT:', missing.length);
console.log('MISSING TEAMS:', missing);
