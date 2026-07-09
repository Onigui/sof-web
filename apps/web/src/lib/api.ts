import { clearSession, getToken } from "./session";

type ApiOptions = RequestInit & {
  skipAuth?: boolean;
};

export class SubscriptionRequiredError extends Error {
  code = "subscription_required";

  constructor(message = "Assinatura necessária.") {
    super(message);
    this.name = "SubscriptionRequiredError";
  }
}

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "");

export const getApiBaseUrl = () => baseUrl;

if (!baseUrl) {
  console.warn("NEXT_PUBLIC_API_BASE_URL is not set.");
}

const parseSubscriptionMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (data.error === "subscription_required") {
        return data.message ?? "Assinatura necessária.";
      }
      return data.message ?? "Assinatura necessária.";
    } catch {
      return "Assinatura necessária.";
    }
  }

  try {
    const text = await response.text();
    return text || "Assinatura necessária.";
  } catch {
    return "Assinatura necessária.";
  }
};

const unwrapPayload = <T>(json: unknown): T => {
  if (json !== null && typeof json === "object") {
    const record = json as Record<string, unknown>;
    if ("data" in record) {
      return record.data as T;
    }
    if ("user" in record && Object.keys(record).length === 1) {
      return record.user as T;
    }
  }

  return json as T;
};

const parseErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as {
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (data.message) {
        return data.message;
      }

      if (data.errors) {
        const first = Object.values(data.errors).flat()[0];
        if (first) {
          return first;
        }
      }
    } catch {
      // fall through
    }
  }

  try {
    const text = await response.text();
    if (text.includes("<!DOCTYPE html>")) {
      return "A API retornou HTML em vez de JSON. Verifique NEXT_PUBLIC_API_BASE_URL e o deploy da API.";
    }
    return text || "Request failed";
  } catch {
    return "Request failed";
  }
};

export const apiFetch = async <T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> => {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!options.skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!headers.has("Content-Type") && options.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  headers.set("X-Requested-With", "XMLHttpRequest");

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 402) {
    const message = await parseSubscriptionMessage(response);
    throw new SubscriptionRequiredError(message);
  }

  if (response.status === 401) {
    clearSession();
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message || "Request failed");
  }

  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();
  return unwrapPayload<T>(json);
};

export const apiDownload = async (
  path: string,
  options: ApiOptions = {},
): Promise<{ blob: Blob; filename?: string }> => {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!options.skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  headers.set("X-Requested-With", "XMLHttpRequest");

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSession();
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition");
  const filenameMatch = contentDisposition?.match(/filename=\"?([^\";]+)\"?/i);
  const filename = filenameMatch?.[1];

  return { blob, filename };
};
