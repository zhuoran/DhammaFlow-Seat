# Legacy Frontend Overview

> Purpose: capture the existing `frontend/` feature scope, API surfaces, and UX flows so the rewrite in `frontend-new/` can maintain functional parity while improving architecture.

---

## High-Level Pages & Responsibilities

| Route | Description | Key Operations |
|-------|-------------|----------------|
| `/` | Dashboard summary | Display hard-coded stats; CTA buttons linking to students/allocations/conflicts/reports |
| `/students` | Student CRUD & Excel import | Fetch students by session, delete, edit inline Form, upload Excel via `/api/students/import-excel?sessionId=` |
| `/course-config` | Session/course metadata form | Load/save config via `sessionApi.getSessionConfig/saveSessionConfig` |
| `/rooms` | Room CRUD + stats + inline bed management | Query rooms per center, edit/create, filter by floor/gender, compute stats, inline bed add/delete |
| `/beds` (hidden menu) | Standalone bed CRUD | Same API as `/rooms` inline bed manager but page-level |
| `/import` | Room/bed Excel import | Upload via `importApi.importRoomsAndBeds`, show progress/result |
| `/allocations` | Auto allocation trigger | Call `allocationApi.autoAllocate` / clear; show summary stats |
| `/allocations/manual` | Manual assignment UI | List unallocated students, assign via modal selecting room/bed (beds filtered by status AVAILABLE) |
| `/allocations/result` | Room allocation visualization | For each room show occupants, allow swap/remove; heavy N+1 fetching |
| `/allocations/conflicts` | Conflict list (mocked) | Table with resolve/delete actions |
| `/allocations/details` | Flat allocation table | Fetch allocation list, enrich with student/room data, provide swap/help actions |
| `/allocations/print` | Printable allocation cards | Similar data as result page but print-friendly |
| `/meditation-seats` | Seat grid placeholder | Sample data only (generate seats, stats) |
| `/reports` | Export/report preview | Hard-coded stats + table previews |

### Shared Patterns
- Every page reads `currentCenter` / `currentSession` from `localStorage`, guarded by `isHydrated`.
- API calls live in `frontend/services/api/*` and expect backend at `NEXT_PUBLIC_API_URL` (default `http://192.168.2.250:8080/api`).
- Responses wrap data as either `{ data: { list: [...] } }` or plain arrays; code handles both.
- Ant Design v5 components dominate UI; styles mostly inline.

---

## API Clients (per `frontend/services/api`)

| Module | Notable Methods |
|--------|-----------------|
| `studentApi` | `getStudents(sessionId, page, size)`, `update/delete/create`, `importStudents`, `countStudents`, `getSortedStudents` |
| `sessionApi` | CRUD for sessions + `getSessionConfig`, `saveSessionConfig` |
| `centerApi` | CRUD for centers |
| `roomApi` | `getRooms(centerId?)`, `create/update/delete`, `createRoomsBatch`, `countRooms` |
| `bedApi` | `getBeds(roomId?)`, `create/update/delete`, `createBedsBatch`, `countBeds`, `deleteBedsOfRoom` |
| `allocationApi` | `autoAllocate`, `getAllocations`, `getAllocationsBySession`, `create/update/delete`, `getConflicts`, `confirm/clear/rollback`, `swapAllocations` |
| `importApi` | `importRoomsAndBeds`, `getImportTemplate` |
| `reportApi` | getters for various reports |
| `meditationSeatApi` | `generateSeats`, `getSeats`, `getSeatsByRegion`, `swapSeats`, etc. |

> **Note**: some pages bypass the apiClient (e.g., hard-coded `fetch('http://192.168.2.250/...')` in allocations pages) — these should be normalized in the rewrite.

---

## Data Dependencies
- **Room**: `id, centerId, roomNumber, building, floor, capacity, roomType, status ('ENABLED'/'DISABLED'), genderArea ('男'/'女'), notes`.
- **Bed**: `id, roomId, bedNumber, position ('上铺'/'下铺'), status ('AVAILABLE'...)`.
- **Student**: large DTO (gender, practices, type, etc.); pages often infer "老/新" via `studyTimes`.
- **Allocation**: `id, sessionId, studentId, bedId, allocationType, allocationReason, conflictFlag`.

Shared UI relies on computed stats:
- Room stats by gender & capacity.
- Student counts (total, allocated, pending).
- Allocation occupancy per room (for tabs/cards/print).

---

## UX Pain Points to Address in Rewrite
1. **Hydration Boilerplate**: centralize center/session context instead of per-page `useEffect`.
2. **N+1 Fetching**: allocations result/print/details pages fetch per-entity sequentially.
3. **Global Bed Fetch**: `bedApi.getBeds()` rarely scoped by `roomId`.
4. **Massive Client Components**: each route >500 lines mixing data + UI.
5. **Inline Styles**: inconsistent with Tailwind+clsx guideline.

Use this overview as the baseline for planning route groups, Server/Client component boundaries, and data hooks in `frontend-new/`.
