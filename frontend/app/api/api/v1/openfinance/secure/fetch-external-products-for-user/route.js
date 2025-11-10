// Proxy route for Open Finance API - Fetch External Products For User
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract Authorization header
    const authHeader = request.headers.get('Authorization');
    
    const backendUrl = process.env.INTERNAL_OPEN_FINANCE_API_URL || 
                       process.env.NEXT_PUBLIC_OPEN_FINANCE_API_URL || 
                       "http://localhost:8003";
    
    const queryString = searchParams.toString();
    const url = `${backendUrl}/api/v1/openfinance/secure/fetch-external-products-for-user/?${queryString}`;
    
    console.log(`🔗 Proxying GET request to: ${url}`);
    
    const headers = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
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

