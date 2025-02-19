import { queryFlux } from "@/lib/query-flux";

export async function POST(req: Request) {
  const { startDate, endDate, startTime, endTime, daysOfWeek } =
    await req.json();

  try {
    const geoJson = await queryFlux({
      startDate,
      endDate,
      startTime,
      endTime,
      daysOfWeek,
    });

    return new Response(JSON.stringify(geoJson));
  } catch (error) {
    console.error("Error getting flux:", {
      error,
      startDate,
      endDate,
      startTime,
      endTime,
      daysOfWeek,
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}
