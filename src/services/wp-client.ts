const { WORDPRESS_SITE_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD } = process.env;

if (!WORDPRESS_SITE_URL) throw new Error('WORDPRESS_SITE_URL environment variable is required');

const baseUrl = `${WORDPRESS_SITE_URL}/wp-json/wp/v2`;

const authHeader =
  WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD
    ? `Basic ${Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`).toString('base64')}`
    : '';

interface WpResponse {
  data: any;
  headers: Record<string, string>;
}

async function request(
  method: string,
  endpoint: string,
  params?: Record<string, any>
): Promise<WpResponse> {
  if (!authHeader) {
    throw new Error(
      'WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD are required for WordPress API operations'
    );
  }

  const url = new URL(`${baseUrl}/${endpoint}`);

  if ((method === 'GET' || method === 'DELETE') && params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const init: RequestInit = {
    method,
    headers: { Authorization: authHeader },
  };

  if ((method === 'POST' || method === 'PUT') && params) {
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    init.body = JSON.stringify(params);
  }

  const response = await fetch(url.toString(), init);

  const headerObj: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headerObj[key.toLowerCase()] = value;
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(`HTTP ${response.status}`);
    error.response = { data: errorData, status: response.status };
    throw error;
  }

  const data = await response.json();
  return { data, headers: headerObj };
}

export const wpApi = {
  get: (endpoint: string, params?: Record<string, any>) => request('GET', endpoint, params),
  delete: (endpoint: string, params?: Record<string, any>) => request('DELETE', endpoint, params),
};
