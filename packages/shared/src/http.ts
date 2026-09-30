/** Erro devolvido pela API (a requisição chegou e foi recusada). Falhas de rede não viram ApiError. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export type HttpClient = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  delete(path: string): Promise<void>;
};

type HttpClientOptions = {
  baseUrl: string;
  /** Headers extras em cada requisição (ex.: chave administrativa). */
  headers?: () => Record<string, string>;
};

/** Cliente JSON mínimo usado pelos fronts: trata erros da API e respostas 204. */
export function createHttpClient({ baseUrl, headers = () => ({}) }: HttpClientOptions): HttpClient {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { ...headers(), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new ApiError(payload.error ?? "Erro na API.", response.status);
    }
    if (response.status === 204) return undefined as T;
    return response.json();
  }

  return {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    put: (path, body) => request("PUT", path, body),
    patch: (path, body) => request("PATCH", path, body),
    delete: (path) => request("DELETE", path),
  };
}

/** Mensagem legível para qualquer erro capturado num `catch`. */
export function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}
