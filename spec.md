# Frėjos žurnalas

## Current State
App has modules: Pampersai, Žindymas, Tummy Time, Svoris, Žurnalas, Pieno nutraukimas. ActivityTimeline shows icons for diaper/breastfeeding/pumping/tummy. No Maitinimas module exists. Timeline icons have no tooltip on click.

## Requested Changes (Diff)

### Add
- New backend type `FeedingSession` with fields: sessionId, childId, timestamp, mlAmount, feedingType ("misinukas" | "mamosPienas")
- stable map `persistentFeedingSessions` in backend
- Backend functions: `addFeedingSession`, `getFeedingSessionsForChild`, `deleteFeedingSession`
- New frontend component `FeedingModule.tsx` mirroring PumpingModule structure
- New menu item "Maitinimas" in MobileMenu and ModuleNavigation
- `feeding` activity type in ActivityTimeline using query `useGetFeedingSessionsForChild`
- Tooltip/label popup on timeline icon click (show activity name)

### Modify
- Dashboard: add `feeding` to ActiveModule type, import FeedingModule, render it
- ActivityTimeline: add feeding events, add click-to-show-label behavior on icons
- backend.d.ts: add FeedingSession type and new methods
- useQueries.ts: add feeding query and mutation hooks
- MobileMenu/ModuleNavigation: add feeding menu item

### Remove
- Nothing

## Implementation Plan
1. Add Motoko types and stable storage for feeding sessions, add CRUD functions in main.mo
2. Update backend.d.ts with FeedingSession interface and new methods
3. Add useQueries hooks for feeding
4. Create FeedingModule.tsx (+ button, popup with auto-time, ml, type selector, stats, history)
5. Update ActivityTimeline to include feeding events and show label on icon click
6. Update Dashboard, MobileMenu, ModuleNavigation with feeding module
