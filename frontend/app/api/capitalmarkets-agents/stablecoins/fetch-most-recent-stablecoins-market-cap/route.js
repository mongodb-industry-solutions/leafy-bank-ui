// Proxy route for Capital Markets Agents API - Fetch Most Recent Stablecoins Market Cap
export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    const backendUrl = process.env.INTERNAL_CAPITALMARKETS_AGENTS_API_URL || 
                       process.env.NEXT_PUBLIC_CAPITALMARKETS_AGENTS_API_URL || 
                       "http://localhost:8005";
    
    const url = `${backendUrl}/stablecoins/fetch-most-recent-stablecoins-market-cap`;
    
    console.log(`🔗 Proxying GET request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      return Response.json(error, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return Response.json(
      { error: 'Failed to connect to backend', details: error.message },
      { status: 500 }
    );
  }
}

