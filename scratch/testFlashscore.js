// Test examining 13.flashscore.ninja in Flashscore HTML
async function test() {
  try {
    const res = await fetch('https://www.flashscore.es/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
    });

    const html = await res.text();
    const idx = html.indexOf('13.flashscore.ninja');
    if (idx !== -1) {
      console.log('Snippet around 13.flashscore.ninja:', html.slice(Math.max(0, idx - 150), idx + 250));
    } else {
      console.log('13.flashscore.ninja not found directly in text');
    }

    // Look for config objects or variables in script tags
    const scriptTags = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || [];
    console.log('Found script tags count:', scriptTags.length);
    for (let i = 0; i < scriptTags.length; i++) {
      const s = scriptTags[i];
      if (s.includes('project_id') || s.includes('feed') || s.includes('config') || s.includes('cjs')) {
        console.log(`Script ${i} snippet:`, s.slice(0, 300));
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
