// Proxy route for Transactions API - Perform Digital Payment
export const dynamic = 'force-dynamic';
export async function POST(request) {
  try {
    const body = await request.json();
    
    const backendUrl = process.env.INTERNAL_TRANSACTIONS_API_URL || 
                       process.env.NEXT_PUBLIC_TRANSACTIONS_API_URL || 
                       "http://localhost:8001";
    
    const url = `${backendUrl}/perform-digital-payment`;
    
    console.log(`🔗 Proxying POST request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

