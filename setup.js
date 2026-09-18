const fs = require('fs');
const path = require('path');

const productSvc = `const API_URL = 'http://localhost:5000/api';

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('webcraft_auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.token || null;
  } catch { return null; }
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
    ...extra
  };
}

export const productService = {
  async getProducts(params?: {
    search?: string;
    category?: string;
    status?: string;
    vendorId?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
    viewAll?: boolean;
  }) {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.category && params.category !== 'All') q.set('category', params.category);
    if (params?.status && params.status !== 'All') q.set('status', params.status);
    if (params?.vendorId && params.vendorId !== 'All') q.set('vendorId', params.vendorId);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortOrder) q.set('sortOrder', params.sortOrder);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.viewAll) q.set('viewAll', 'true');
    const res = await fetch(\`\${API_URL}/products?\${q.toString()}\`, { headers: authHeaders() });
    return res.json();
  },

  async getStats() {
    const res = await fetch(\`\${API_URL}/products/stats\`, { headers: authHeaders() });
    return res.json();
  },

  async getProductById(id: string) {
    const res = await fetch(\`\${API_URL}/products/\${id}\`, { headers: authHeaders() });
    return res.json();
  },

  async createProduct(data: Record<string, unknown>) {
    const res = await fetch(\`\${API_URL}/products\`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateProduct(id: string, data: Record<string, unknown>) {
    const res = await fetch(\`\${API_URL}/products/\${id}\`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteProduct(id: string) {
    const res = await fetch(\`\${API_URL}/products/\${id}\`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return res.json();
  },

  async importCsv(csvData: string) {
    const res = await fetch(\`\${API_URL}/products/import-csv\`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ csvData })
    });
    return res.json();
  }
};
`;

const vendorSvc = `const API_URL = 'http://localhost:5000/api';

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('webcraft_auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.token || null;
  } catch { return null; }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: \`Bearer \${token}\` } : {})
  };
}

export const vendorService = {
  async getVendors() {
    const res = await fetch(\`\${API_URL}/vendors\`, { headers: authHeaders() });
    return res.json();
  },

  async getVendorProducts(vendorId: string) {
    const res = await fetch(\`\${API_URL}/vendors/\${vendorId}/products\`, { headers: authHeaders() });
    return res.json();
  }
};
`;

fs.writeFileSync(path.join(__dirname, 'frontend/src/services/productService.ts'), productSvc, 'utf-8');
fs.writeFileSync(path.join(__dirname, 'frontend/src/services/vendorService.ts'), vendorSvc, 'utf-8');
console.log('Frontend services written successfully.');
