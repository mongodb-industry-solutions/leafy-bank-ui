// Proxy route for Open Finance API - Calculate Total Debt For User
export const dynamic = 'force-dynamic';
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Extract Authorization header
    const authHeader = request.headers.get('Authorization');
    
    const backendUrl = process.env.INTERNAL_OPEN_FINANCE_API_URL || 
                       process.env.NEXT_PUBLIC_OPEN_FINANCE_API_URL || 
                       "http://localhost:8003";
    
    const url = `${backendUrl}/api/v1/openfinance/secure/calculate-total-debt-for-user/`;
    
    console.log(`🔗 Proxying POST request to: ${url}`);
    
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
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

