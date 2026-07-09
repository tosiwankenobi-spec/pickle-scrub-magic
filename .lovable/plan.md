## Goal
Replace the current `view` state (`dashboard`/`cleanup`/`duplicates`/`history` etc.) with real TanStack routes so each home-screen card and nav item performs a real navigation.

## Proposed routes

```text
/              -> Dashboard (home)
/scan          -> Scan (or reuse / with scan trigger; to be decided)
/clean         -> Smart Cleanup
/duplicates    -> Duplicate Finder
/history       -> History
/settings      -> Settings
/roadmap       -> Roadmap
```

## Implementation steps

1. **Lift shared state into a context**
   - Create `src/lib/pickle-context.tsx` with a `PickleProvider` that holds:
     - `darkMode`, `groups`, `history`, `selected`, `scanning`, `scanProgress`, `enabledTypes`, `minDupSize`, `scanDepth`, `excluded`
     - Derived helpers: `filteredGroups`, `reclaimableSelected`, `selectedFiles`
     - Actions: `startScan`, `confirmDelete`, `toggleFile`, `setView` (removed)
   - Persist to `localStorage` from the provider, same as today.

2. **Wrap the app in the provider**
   - Add `PickleProvider` around `<Outlet />` in `src/routes/__root.tsx`.

3. **Create route files**
   - `src/routes/index.tsx` -> Dashboard
   - `src/routes/clean.tsx` -> Smart Cleanup
   - `src/routes/duplicates.tsx` -> Duplicate Finder
   - `src/routes/history.tsx` -> History
   - `src/routes/settings.tsx` -> Settings
   - `src/routes/roadmap.tsx` -> Roadmap

4. **Extract navigation into a shared layout/component**
   - Move the desktop sidebar and mobile bottom nav from `index.tsx` into `src/components/app-shell.tsx` (or similar).
   - Render the shell inside each route, or via a pathless `_app.tsx` layout that wraps the routes.
   - Update nav items to use `<Link to="/" | "/clean" | "/duplicates" | "/history" | "/settings" | "/roadmap">`.

5. **Update home screen cards**
   - Replace the `onClick={() => setView(...)}` calls on the four dashboard cards with `<Link to="/scan">`, `<Link to="/clean">`, `<Link to="/duplicates">`, `<Link to="/history">`.

6. **Update the scan button**
   - Decide whether Scan should be its own route (`/scan`) or just trigger the scan on the dashboard. If a separate route, create `/scan` with a progress view; otherwise keep the scan trigger on `/`.

7. **Clean up**
   - Remove the `ViewId` state and `NAV` setView handlers from `index.tsx`.
   - Remove now-unused imports.
   - Run full build and verify navigation.

## Open question
- Should **Scan** be a standalone `/scan` route (full-screen progress) or remain a dashboard action that starts the scan while staying on `/`?

Please confirm the Scan behavior, or I can default to keeping it as a dashboard action (start scan on `/`).