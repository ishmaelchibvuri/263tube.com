import { getServerSession } from "@/lib/auth-server";
import { getCreatorForClaim } from "@/lib/actions/search-creators";
import ClaimProfileForm, { type ClaimSessionData } from "./ClaimProfileForm";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ creator?: string }>;
}

export default async function ClaimProfilePage({ searchParams }: PageProps) {
  const { creator: creatorSlug } = await searchParams;
  const { user, isAuthenticated } = await getServerSession();

  let sessionData: ClaimSessionData | null = null;

  if (isAuthenticated && user) {
    sessionData = {
      name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      email: user.email,
      role: user.role,
    };
  }

  // Pre-select creator if slug is provided via URL param
  const preSelectedCreator = creatorSlug
    ? await getCreatorForClaim(creatorSlug)
    : null;

  return (
    <ClaimProfileForm
      session={sessionData}
      preSelectedCreator={preSelectedCreator}
    />
  );
}
