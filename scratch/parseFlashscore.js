// Parser tester for Flashscore feed
async function parseFlashscore() {
  const url = 'https://13.flashscore.ninja/13/x/feed/f_1_0_3_es-es_1';
  const res = await fetch(url, {
    headers: {
      'x-fsign': 'SW9D1eZo',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.flashscore.es/',
    },
  });

  const raw = await res.text();
  console.log('Raw feed size:', raw.length);

  // Split by ~
  const blocks = raw.split('~');
  console.log('Total blocks:', blocks.length);

  let currentTournament = null;
  let matches = [];

  for (const block of blocks) {
    if (!block.trim()) continue;

    // Split fields by ¬
    const fields = block.split('¬');
    const dict = {};
    for (const f of fields) {
      const [k, v] = f.split('÷');
      if (k && v !== undefined) {
        dict[k] = v;
      }
    }

    // Check if tournament header
    if (dict['ZA']) {
      currentTournament = {
        name: dict['ZA'],
        country: dict['ZY'] || 'Internacional',
        url: dict['ZL'] || '',
        logo: dict['OAJ'] || '',
      };
    }

    // Check if match item (has AA which is event ID, and AE / AF which are home/away teams)
    if (dict['AA'] && dict['AE'] && dict['AF']) {
      const matchId = dict['AA'];
      const homeTeam = dict['AE'];
      const awayTeam = dict['AF'];
      const timestamp = parseInt(dict['AD'] || '0', 10);
      const homeScore = dict['AG'] !== undefined ? parseInt(dict['AG'], 10) : undefined;
      const awayScore = dict['AH'] !== undefined ? parseInt(dict['AH'], 10) : undefined;
      const statusCode = dict['AB']; // 1 = not started, 2 = live, 3 = finished
      const statusText = dict['AC'] || '';

      matches.push({
        id: matchId,
        tournament: currentTournament?.name || 'General',
        country: currentTournament?.country || '',
        url: currentTournament?.url || '',
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        timestamp,
        date: new Date(timestamp * 1000).toISOString(),
        statusCode,
        statusText,
        homeLogo: dict['PX'] ? `https://static.flashscore.com/res/image/data/${dict['PX']}` : undefined,
        awayLogo: dict['PY'] ? `https://static.flashscore.com/res/image/data/${dict['PY']}` : undefined,
      });
    }
  }

  console.log('Total matches parsed:', matches.length);
  const sample = matches.slice(0, 5);
  console.log('Sample parsed matches:', JSON.stringify(sample, null, 2));

  // Find Spanish or top tournaments
  const topMatches = matches.filter(m =>
    m.tournament.toLowerCase().includes('laliga') ||
    m.tournament.toLowerCase().includes('premier') ||
    m.tournament.toLowerCase().includes('champions') ||
    m.tournament.toLowerCase().includes('europa') ||
    m.tournament.toLowerCase().includes('serie a') ||
    m.tournament.toLowerCase().includes('españa')
  );
  console.log('Top/Spanish matches count:', topMatches.length);
  if (topMatches.length > 0) {
    console.log('Top match 0:', topMatches[0]);
  }
}

parseFlashscore();
