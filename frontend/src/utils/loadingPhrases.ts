interface LoadingPhrasesRequest {
  location: string;
  year: number;
  era?: string;
  lat?: number;
  lng?: number;
  count?: number;
}

interface LoadingPhrasesResponse {
  phrases: string[];
}

function getBackendBaseUrl(): string {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl && String(envUrl).trim().length > 0) return String(envUrl).trim();

  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return 'http://localhost:8000';
  }

  return '';
}

export async function fetchLoadingPhrases(
  payload: LoadingPhrasesRequest,
  signal?: AbortSignal,
): Promise<string[]> {
  const baseUrl = getBackendBaseUrl();
  const url = baseUrl ? `${baseUrl}/api/loading/phrases` : '/api/loading/phrases';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    throw new Error(`loading phrases request failed: ${res.status}`);
  }

  const data = (await res.json()) as LoadingPhrasesResponse;
  return Array.isArray(data?.phrases) ? data.phrases : [];
}
