Prompt for Claude: Admin Dashboard & Auto-Sync Engine
Context: We need to build the full Admin functionality for 263Tube. The Admin needs a centralized dashboard to manage the platform and an automated system to keep creator stats fresh.

Task 1: The Admin Dashboard Layout (app/admin/dashboard/page.tsx)

Create a grid-based dashboard with the following "Quick Stats":

Total Creators (Active vs. Pending).

Total Platform Reach (Sum of all creator reach).

Inquiry Volume (Total business leads generated).

Add a "System Actions" sidebar with buttons for:

Trigger Global Sync (Manual override for stats update).

Manage Submissions (Link to the approval queue).

Task 2: The Auto-Sync Service (src/lib/actions/sync-engine.ts)

Create a server action syncAllCreatorStats().

Logic:

Fetch all STATUS#ACTIVE creators.

For each creator, iterate through their verifiedLinks.

Call the relevant validatePlatformLink logic (from our previous module) to get the latest follower/sub counts.

Update the metrics.totalReach and referralStats in DynamoDB.

Efficiency: Use Promise.all() to fetch data in batches so the sync doesn't take forever.

Task 3: The "Verified" Badge Management

In the Admin UI, add a toggle for "Manual Verification Override." This allows the Admin to manually mark a creator as verified even if the API scraper had trouble with their specific Instagram/TikTok profile.

Task 4: Admin Search & Filter

Provide a searchable table of all registered users so the Admin can quickly find a creator and impersonate/edit their profile if they report a bug.
