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

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const parseSubscriptionMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as { error?: string; message?: string };
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
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
};
