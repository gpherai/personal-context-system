import { isDatabaseUnavailable } from "@/application/errors";

const NO_STORE = { "cache-control": "no-store" } as const;

export function apiOk(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export function apiError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: NO_STORE });
}

export async function withApiErrors(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return apiError("The local database is not available.", 503);
    }
    throw error;
  }
}
