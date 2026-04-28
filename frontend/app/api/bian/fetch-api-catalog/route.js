// Proxy route for Accounts API - Fetch BIAN API Catalog (no-body GET).
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const backendUrl = process.env.INTERNAL_ACCOUNTS_API_URL ||
                       process.env.NEXT_PUBLIC_ACCOUNTS_API_URL ||
                       "http://localhost:8000";

    const url = `${backendUrl}/fetch-bian-api-catalog`;

    console.log(`🔗 Proxying GET request to: ${url}`);

    const response = await fetch(url, { method: 'GET' });

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
