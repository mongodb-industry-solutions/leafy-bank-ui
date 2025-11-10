// Proxy route for Capital Markets React Crypto API - Send Message to Crypto Assistant Chatbot
export async function POST(request) {
  try {
    const body = await request.json();
    
    const backendUrl = process.env.INTERNAL_CAPITALMARKETS_REACT_CRYPTO_API_URL || 
                       process.env.NEXT_PUBLIC_CAPITALMARKETS_REACT_CRYPTO_API_URL || 
                       "http://localhost:8007";
    
    const url = `${backendUrl}/crypto-assistant/send-message`;
    
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

