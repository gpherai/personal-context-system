import { isRecoverableReadError } from "@/application/errors";
import { getDashboardOverview } from "@/application/query-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const overview = await getDashboardOverview();

    return Response.json(overview, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (isRecoverableReadError(error)) {
      return Response.json(
        { error: "The local database is not available." },
        {
          status: 503,
          headers: {
            "cache-control": "no-store",
          },
        }
      );
    }

    throw error;
  }
}
