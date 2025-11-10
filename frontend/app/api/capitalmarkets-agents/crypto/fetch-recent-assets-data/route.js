// Proxy route for Capital Markets Agents API - Crypto Fetch Recent Assets Data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const backendUrl = process.env.INTERNAL_CAPITALMARKETS_AGENTS_API_URL || 
                       process.env.NEXT_PUBLIC_CAPITALMARKETS_AGENTS_API_URL || 
                       "http://localhost:8005";
    
    const url = `${backendUrl}/crypto/fetch-recent-assets-data${queryString ? '?' + queryString : ''}`;
    
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

