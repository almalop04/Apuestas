// Test 13.flashscore.ninja
async function test() {
  const fsignList = ['SW9D1eZo', 'W6BOzpK2', 'SW9operaator'];
  for (const fsign of fsignList) {
    const urls = [
      'https://13.flashscore.ninja/13/x/feed/f_1_0_3_es-es_1',
      'https://13.flashscore.ninja/x/feed/f_1_0_3_es-es_1',
      'https://13.ds.lsapp.eu/pq_graphql',
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            'x-fsign': fsign,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://www.flashscore.es/',
          },
        });
        console.log(`URL: ${url} | fsign: ${fsign} -> Status: ${res.status}`);
        if (res.ok) {
          const text = await res.text();
          console.log('SUCCESS! Text length:', text.length, 'sample:', text.slice(0, 200));
          return;
        }
      } catch (e) {
        console.error(url, e.message);
      }
    }
  }
}
test();
