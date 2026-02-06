import { getServerSession } from "@/lib/auth-server";
import SubmitCreatorForm, { type SubmitSessionData } from "./SubmitCreatorForm";

export const dynamic = "force-dynamic";

export default async function SubmitCreatorPage() {
  const { user, isAuthenticated } = await getServerSession();

  let sessionData: SubmitSessionData | null = null;

  if (isAuthenticated && user) {
    sessionData = {
      name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      email: user.email,
      role: user.role,
      creatorSlug: user.creatorSlug,
    };
  }

  return <SubmitCreatorForm session={sessionData} />;
}
