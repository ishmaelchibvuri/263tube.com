import { getRequestByTrackingId } from "@/lib/actions/track";
import TrackingView from "./TrackingView";

export const dynamic = "force-dynamic";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRequestByTrackingId(id);

  return <TrackingView data={data} />;
}
