export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    
    // Handle POST /games/add endpoint
    if (request.method === 'POST' && url.pathname === '/games/add') {
      try {
        const body = await request.json();
        const { name, app_id, store } = body;

        if (store !== 'steam' && store !== 'gog') {
          return new Response(JSON.stringify({ error: 'Store not found' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const result = {
          name,
          app_id,
          store,
          thumbnail_url: ''
        };

        // Only fetch Steam data if app_id is provided and store is steam
        if (app_id !== 0 && store === 'steam') {
          const gameData = await getGameByAppId(app_id);
          
          if (gameData.error) {
            return new Response(JSON.stringify({ error: gameData.error }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }

          result.name = gameData.game_name;
          result.thumbnail_url = gameData.thumbnail_url;
        }

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function getGameByAppId(appId) {
  const url = 'https://store.steampowered.com/api/appdetails';
  
  try {
    const response = await fetch(`${url}?appids=${appId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if the game details are available
    if (data[appId.toString()]?.success) {
      const gameData = data[appId.toString()].data;
      const name = gameData.name || '';
      const thumbnailUrl = gameData.header_image || '';

      return {
        game_name: name,
        thumbnail_url: thumbnailUrl
      };
    } else {
      return { error: 'Game not found' };
    }

  } catch (error) {
    console.error('Steam API error:', error);
    return { error: error.message };
  }
}
