
**Goal**: Expand the hero search functionality on the Heroes List page to allow searching by keyword within hero skills, and implement synonym matching so searching for "Ally Attack" also returns heroes with "Join Attack".

**Technical Approach**:
1.  **Enhance the Data Fetching**: 
    Update the `useQuery` in `src/pages/HeroesList.tsx` to fetch the skills associated with each hero. We will add `skills(name, description, effects)` to the existing Supabase `.select()` call. This allows the client-side search to access all skill text.
2.  **Implement Keyword Synonyms**:
    Create a `keywordAliases` dictionary inside `HeroesList.tsx` to group similar game terms. For example, mapping `"ally attack"` to `["ally attack", "join attack"]` (and vice versa) so the user can search either term and get both results.
3.  **Update the Search Filter**:
    Modify the `filtered` array logic (`useMemo`) to:
    *   Check if the user's search string matches any of the predefined aliases, and expand the search terms if it does.
    *   Filter heroes by checking if any of the `searchTerms` are included in the hero's `name` **OR** within any of their skills' `name`, `description`, or `effects`.

This approach ensures the search remains snappy (client-side) while unlocking deep, keyword-based searching across a hero's entire kit.
