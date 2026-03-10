interface McpToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

const ERROR_GUIDANCE: Record<string, string> = {
  rest_post_invalid_type: 'Invalid product type. Valid types: simple, variable, grouped, external.',
  woocommerce_rest_cannot_delete:
    'Cannot delete. Try force=true to permanently delete instead of trashing.',
  woocommerce_rest_product_invalid_id: 'Product not found. Verify the ID with list_products.',
  rest_cannot_update: 'Cannot update. Check if the item exists and is not trashed.',
  woocommerce_rest_invalid_id:
    'Resource not found. Verify the ID exists using the corresponding list tool.',
  woocommerce_rest_cannot_view: 'Cannot view this resource. Check API credentials and permissions.',
  woocommerce_rest_cannot_create:
    'Cannot create this resource. Check required fields and API permissions.',
  term_exists: 'This term already exists. Use the existing term or choose a different name.',
};

const HTTP_GUIDANCE: Record<number, string> = {
  401: 'Authentication error. Check WooCommerce API consumer key and secret.',
  403: 'Authorization error. The API key lacks permission for this action.',
  404: 'Resource not found. Verify the ID exists.',
  429: 'Rate limited by WooCommerce. Wait a few seconds and retry.',
};

function extractError(error: unknown): McpToolResponse {
  let message = 'Unknown error occurred';

  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response?: { data?: { code?: string; message?: string }; status?: number };
    };
    const data = axiosError.response?.data;
    const status = axiosError.response?.status;

    if (data?.message) {
      message = data.code ? `[${data.code}] ${data.message}` : data.message;
      const guidance = data.code && ERROR_GUIDANCE[data.code];
      if (guidance) message += ` — ${guidance}`;
    } else if (status) {
      message = `HTTP ${status} error`;
    }

    if (!data?.code && status && HTTP_GUIDANCE[status]) {
      message += ` — ${HTTP_GUIDANCE[status]}`;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}

export async function handleListRequest(
  promise: Promise<any>,
  currentPage: number,
  perPage: number,
  fields: string[]
): Promise<McpToolResponse> {
  try {
    const response = await promise;
    const result = {
      data: pickFields(response.data, fields),
      pagination: {
        total: parseInt(response.headers['x-wp-total'] || '0', 10),
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '1', 10),
        currentPage,
        perPage,
      },
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return extractError(error);
  }
}

export async function handleRequest(
  promise: Promise<any>,
  fields: string[]
): Promise<McpToolResponse> {
  try {
    const response = await promise;
    const data = pickFields(response.data, fields);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  } catch (error) {
    return extractError(error);
  }
}

export function resolveFields(fields: string | undefined, defaults: string[]): string[] {
  return fields ? fields.split(',').map((f) => f.trim()) : defaults;
}

function pickFields(data: any, fields: string[]): any {
  if (Array.isArray(data)) return data.map((item) => pickFields(item, fields));
  if (!data || typeof data !== 'object') return data;
  const result: Record<string, unknown> = {};
  for (const key of fields) {
    if (key in data) result[key] = data[key];
  }
  return result;
}
