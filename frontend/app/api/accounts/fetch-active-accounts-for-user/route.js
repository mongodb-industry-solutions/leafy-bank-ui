// Proxy route for Accounts API - Fetch Active Accounts For User
export const dynamic = 'force-dynamic';
export async function POST(request) {
  try {
    const body = await request.json();
    
    const backendUrl = process.env.INTERNAL_ACCOUNTS_API_URL || 
                       process.env.NEXT_PUBLIC_ACCOUNTS_API_URL || 
                       "http://localhost:8000";
    
    const url = `${backendUrl}/fetch-active-accounts-for-user`;
    
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

