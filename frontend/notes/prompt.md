Final Consolidated Prompt (The "All-In-One" Refactor)
Context: We are moving the entire platform's niche/category system from static code to a dynamic, database-driven model. This must affect the Creator Submission form, the filtering system, and all category-specific pages.

Task 1: The Global Category Fetcher (src/lib/actions/categories.ts)

Create an async function getAllCategories().

Logic: Query the DynamoDB CATEGORIES table (or the unique attributes from the CREATORS table).

Caching: Use Next.js unstable_cache or revalidatePath to ensure this isn't hitting the database on every single hover/click, but refreshes whenever a new niche is added.

Task 2: Dynamic Submission Form (app/submit/page.tsx)

Replace the hard-coded NICHES import with the result of await getAllCategories().

Ensure that when a user is creating a profile, the dropdown/multi-select reflects every category currently in the database.

Task 3: Dynamic Navigation & Filtering (app/categories/page.tsx & components/FilterBar.tsx)

Refactor the "Categories" landing page and the search filter sidebar to be Server Components.

They must dynamically map the list of categories from the database into <Link> and <Button> components.

Filter Logic: Ensure that clicking a category triggers a search query that matches the new dynamic niche values.

Task 4: Missing Category Auto-Injection

Update the Sync Engine (src/lib/actions/sync-engine.ts) so that when a new YouTube category is found (e.g., "Nonprofits"):

It is added to the CATEGORIES table.

revalidatePath('/') is called.

Result: The moment you sync a new creator, their category immediately appears in the filters and navigation for all users without you writing a single line of code.
