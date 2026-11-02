// Script to test URLs for the 33 teams from API-Sports and ESPN
const testUrls = {
  'fiorentina': 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png',
  'lecce': 'https://a.espncdn.com/i/teamlogos/soccer/500/113.png',
  'frosinone': 'https://a.espncdn.com/i/teamlogos/soccer/500/6940.png',
  'real sporting': 'https://a.espncdn.com/i/teamlogos/soccer/500/92.png',
  'r. racing club': 'https://a.espncdn.com/i/teamlogos/soccer/500/87.png',
  'castellon': 'https://a.espncdn.com/i/teamlogos/soccer/500/7527.png',
  'ad ceuta': 'https://a.espncdn.com/i/teamlogos/soccer/500/8159.png',
  'unionistas': 'https://a.espncdn.com/i/teamlogos/soccer/500/19084.png',
  'real jaen': 'https://a.espncdn.com/i/teamlogos/soccer/500/7533.png',
  'real avila': 'https://a.espncdn.com/i/teamlogos/soccer/500/8161.png',
  'guijuelo': 'https://a.espncdn.com/i/teamlogos/soccer/500/8162.png',
  'xerez cd': 'https://a.espncdn.com/i/teamlogos/soccer/500/106.png',
  'san sebastian de los reyes': 'https://a.espncdn.com/i/teamlogos/soccer/500/8160.png',
  'antequera': 'https://a.espncdn.com/i/teamlogos/soccer/500/21579.png',
  'coruxo': 'https://a.espncdn.com/i/teamlogos/soccer/500/8164.png',
  'aguilas fc': 'https://a.espncdn.com/i/teamlogos/soccer/500/8165.png',
  'conquense': 'https://a.espncdn.com/i/teamlogos/soccer/500/8166.png',
  'poblense': 'https://a.espncdn.com/i/teamlogos/soccer/500/8167.png',
  'pena sport': 'https://a.espncdn.com/i/teamlogos/soccer/500/8168.png',
  'cd coria': 'https://a.espncdn.com/i/teamlogos/soccer/500/19085.png',
  'laredo': 'https://a.espncdn.com/i/teamlogos/soccer/500/19086.png',
  'ud ourense': 'https://a.espncdn.com/i/teamlogos/soccer/500/19087.png',
  'prat': 'https://a.espncdn.com/i/teamlogos/soccer/500/8169.png'
};

async function testAll() {
  for (const [team, url] of Object.entries(testUrls)) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(team, '=> Status:', res.status);
    } catch (e) {
      console.log(team, '=> Error:', e.message);
    }
  }
}

testAll();
