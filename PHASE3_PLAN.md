# Phase 3: Polish + Background Sync

## Current State (Phase 2 Complete)
✅ All 6 Rust unit tests passing
✅ Backend compiles cleanly with zero errors
✅ Frontend builds successfully
✅ Recharts integration complete (5 chart components)
✅ Sortable/filterable ticket table
✅ Settings UI with Jira connection form
✅ Print CSS for PDF export via window.print()

## Phase 3 Objectives
Complete the MVP by adding background sync scheduling, progress feedback, and comprehensive testing.

---

## Step 25: Background Scheduler (services/scheduler.rs)

**Goal**: Auto-sync on configurable interval without blocking UI

**Implementation**:
```rust
// src-tauri/src/services/scheduler.rs
use tokio::time::{interval, Duration};
use crate::commands::sync::perform_sync;

pub async fn start_background_sync(
    interval_minutes: u64,
    db: Arc<Mutex<Connection>>,
    settings: JiraSettings
) {
    let mut ticker = interval(Duration::from_secs(interval_minutes * 60));

    loop {
        ticker.tick().await;
        log::info!("Background sync triggered");

        match perform_sync(&db, settings.clone()).await {
            Ok(_) => log::info!("Background sync completed"),
            Err(e) => log::error!("Background sync failed: {}", e),
        }
    }
}
```

**Integration Points**:
- Add `start_sync_scheduler` Tauri command
- User configures interval in Settings (default: manual only)
- Scheduler runs in tokio::spawn background task
- Emits events on start/complete/error

**Testing**:
- Unit test: Verify interval math (30 min = 1800 seconds)
- Integration: Mock time, verify sync fires
- Manual: Set 1-minute interval, watch logs

**Acceptance Criteria**:
- [ ] Scheduler starts on app launch if interval > 0
- [ ] Sync fires at correct interval (within 5 second accuracy)
- [ ] Errors don't crash scheduler (retry next interval)
- [ ] User can change interval without restart

---

## Step 26: Sync Progress Events (Tauri → Frontend)

**Goal**: Real-time progress feedback during sync (e.g., "Fetched 47/200 tickets")

**Implementation**:

**Backend (Rust)**:
```rust
// In sync.rs
use tauri::Manager;

pub async fn trigger_sync_with_progress(
    app_handle: tauri::AppHandle,
    // ... other params
) -> Result<(), AppError> {
    app_handle.emit("sync-started", ()).ok();

    // During fetch loop
    for page in 0..total_pages {
        let fetched = page * 100;
        app_handle.emit("sync-progress", SyncProgress {
            fetched,
            total: Some(total_count),
            phase: "fetching"
        }).ok();
    }

    app_handle.emit("sync-categorizing", ()).ok();
    // ... categorize

    app_handle.emit("sync-complete", SyncResult {
        synced: count,
        errors: 0
    }).ok();

    Ok(())
}
```

**Frontend (React)**:
```typescript
// In useAppStore
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
    const unlistenProgress = listen('sync-progress', (event) => {
        set({ syncProgress: event.payload });
    });

    return () => { unlistenProgress.then(fn => fn()); };
}, []);
```

**UI Component**:
```tsx
// SyncProgressBar.tsx
{syncStatus === 'syncing' && (
    <div className="fixed bottom-4 right-4 bg-surface-alt p-4 rounded shadow">
        <div>Syncing tickets...</div>
        <div className="w-64 h-2 bg-gray-700 rounded mt-2">
            <div
                className="h-full bg-primary rounded"
                style={{ width: `${progress}%` }}
            />
        </div>
        <div className="text-sm text-muted mt-1">
            {fetched} / {total} tickets
        </div>
    </div>
)}
```

**Testing**:
- Unit test: Event emission (mock app_handle)
- Integration: Trigger sync, verify events received in order
- Manual: Watch progress bar during 200+ ticket sync

**Acceptance Criteria**:
- [ ] Progress bar shows during sync
- [ ] Accurate count displayed (fetched/total)
- [ ] Phase indicators ("Fetching...", "Categorizing...", "Complete!")
- [ ] Errors don't break progress UI

---

## Step 27: End-to-End Testing

**Goal**: Verify complete user journey with real Jira instance

**Test Scenarios**:

### E2E Test 1: First-Time Setup
1. Launch app (fresh state, no DB)
2. Navigate to Settings
3. Enter Jira URL, email, API token
4. Click "Sync Now"
5. **Verify**:
   - Progress indicator appears
   - Tickets appear in DB
   - Dashboard shows aggregations
   - Tickets view shows table
6. Click "Export PDF"
7. **Verify**: Browser print dialog opens

### E2E Test 2: Incremental Sync
1. Perform initial sync (100 tickets)
2. Update 5 tickets in Jira (change status/summary)
3. Wait 2 minutes
4. Trigger manual sync
5. **Verify**:
   - Only changed tickets refetched (check logs)
   - Updated data reflected in UI
   - Last sync timestamp updated

### E2E Test 3: Error Recovery
1. Enter invalid API token
2. Click Sync
3. **Verify**: Error message displayed, no crash
4. Enter valid token
5. Click Sync
6. **Verify**: Sync succeeds, dashboard populates

### E2E Test 4: Category Override Persistence
1. Sync tickets
2. Manually override category for 1 ticket
3. Trigger sync again
4. **Verify**: Manual override preserved (not overwritten)

### E2E Test 5: Filtering & Sorting
1. Sync 50+ tickets
2. Filter by Priority = "High"
3. **Verify**: Only High priority tickets shown
4. Sort by Created Date descending
5. **Verify**: Newest tickets first
6. Clear filters
7. **Verify**: All tickets shown again

**Testing Checklist**:
- [ ] Fresh install on macOS
- [ ] Real Jira Cloud instance (test account)
- [ ] 100+ tickets synced
- [ ] All filters/sorts tested
- [ ] PDF export works
- [ ] Token security verified (keyring, not in logs)

---

## Step 28: Cross-Platform Verification (macOS Primary)

**Goal**: Ensure app works on target platform

**macOS Testing**:
- [ ] Build release binary: `npm run tauri build`
- [ ] Install .dmg on fresh macOS machine
- [ ] Verify keychain integration (token stored in Keychain Access.app)
- [ ] Verify app icon shows in Dock
- [ ] Verify window resizing works
- [ ] Test print-to-PDF saves to ~/Downloads

**Windows Testing (Stretch)**:
- [ ] Build on Windows: `npm run tauri build`
- [ ] Verify Credential Manager integration
- [ ] Test basic sync flow

**Performance Benchmarks**:
- [ ] Dashboard load time <2s with 500 tickets
- [ ] Sync 100 tickets in <10s
- [ ] Table sort/filter response <300ms

---

## Additional Polish (Time Permitting)

### Formatters Library
```typescript
// src/lib/formatters.ts
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(isoDate: string): string {
    return format(parseISO(isoDate), 'MMM d, yyyy');
}

export function formatRelativeTime(isoDate: string): string {
    return formatDistanceToNow(parseISO(isoDate), { addSuffix: true });
}

export function formatDuration(hours: number): string {
    if (hours < 1) return `${(hours * 60).toFixed(0)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
}
```

### Loading Skeletons
```tsx
// components/common/Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-gray-700 rounded ${className}`} />
    );
}

// Usage in Dashboard
{isLoadingAggregations && (
    <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
    </div>
)}
```

### Toast Notifications
```tsx
// components/common/Toast.tsx
export function Toast({
    message,
    type = 'info'
}: {
    message: string;
    type?: 'info' | 'success' | 'error'
}) {
    const bg = {
        info: 'bg-blue-900',
        success: 'bg-green-900',
        error: 'bg-red-900'
    }[type];

    return (
        <div className={`fixed top-4 right-4 ${bg} px-4 py-3 rounded shadow-lg`}>
            {message}
        </div>
    );
}
```

---

## Definition of Done (Phase 3)

### Technical Checklist
- [ ] All Rust tests pass (cargo test)
- [ ] All TypeScript tests pass (npm test)
- [ ] Zero Clippy warnings (cargo clippy)
- [ ] Zero ESLint errors (npm run lint)
- [ ] Build succeeds (npm run tauri build)
- [ ] App launches without crashes
- [ ] Background sync works without blocking UI
- [ ] Progress events fire correctly

### Functional Checklist
- [ ] User can connect to Jira (3 inputs: URL, email, token)
- [ ] Sync fetches 100+ tickets in <15 seconds
- [ ] Dashboard shows 5 charts with real data
- [ ] Tickets table sorts/filters correctly
- [ ] Category overrides persist across syncs
- [ ] PDF export generates printable report
- [ ] Token stored securely (OS keychain)
- [ ] Errors display user-friendly messages (no raw Rust errors)

### Security Checklist
- [ ] API token not in logs
- [ ] API token not in SQLite database
- [ ] API token not in settings.json
- [ ] Token retrieved from OS keychain only
- [ ] No credentials in crash dumps

---

## Known Limitations (Document for User)

1. **Time-to-resolution caveat**: Includes multitasking, off-hours. Trends only, not absolute.
2. **Jira Cloud only**: API endpoints differ for Jira Server/Data Center.
3. **Single assignee**: Currently filters for `assignee = currentUser()` only.
4. **Manual sync default**: Background scheduler requires explicit setup in Settings.
5. **No multi-account**: One Jira instance at a time.

---

## Post-MVP Enhancements (Not in Phase 3)

These are explicitly out of scope but can be added later:
- Zendesk integration
- Ollama/LLM categorization
- Weekly email digest (SMTP)
- System tray icon
- Category rule editor UI (currently edit settings.json)
- Predictive analytics
- Multi-platform CI/CD

---

## Final Verification Command Sequence

```bash
# 1. Clean build
cargo clean
npm run build

# 2. Run tests
cargo test
npm test

# 3. Lint
cargo clippy -- -D warnings
npm run lint

# 4. Build release
npm run tauri build

# 5. Manual smoke test
# - Launch app
# - Settings → Enter Jira creds → Sync
# - Dashboard → Verify charts
# - Tickets → Filter/sort
# - Dashboard → Export PDF
# - Quit app, relaunch → Verify data persists

# 6. Security audit
# - Check ~/Library/Application Support/com.ticketdashboard.app/tickets.db
#   (should NOT contain token)
# - Check ~/.claude/plans/settings.json (should NOT contain token)
# - Check Console.app logs (should NOT contain token)
# - Open Keychain Access.app → Search "ticket-dashboard" → Verify token present
```

---

## Success Metrics

- ✅ Phase 1 complete: 6/6 Rust tests passing
- ✅ Phase 2 complete: Frontend builds, all views functional
- 🔄 Phase 3 target: All E2E scenarios pass
- 🎯 MVP shipped: User can sync Jira → view analytics → export PDF in <5 minutes
