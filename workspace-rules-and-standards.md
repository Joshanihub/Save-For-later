# NOTEWISE WORKSPACE RULES & STANDARDS
## Engineering Excellence Guidelines for Project Success

---

## 🎯 CORE PRINCIPLES (Non-Negotiable)

### 1. **Privacy by Default**
- All data encrypted at rest (IndexedDB)
- No unencrypted data in transit except over HTTPS
- User consent for any tracking/analytics
- GDPR/CCPA compliant by design
- Security audit before every major release

### 2. **Offline-First Mentality**
- Every feature must work offline first
- Network requests are enhancements, not requirements
- Sync failures are graceful, never silent
- Users always see sync status
- Offline testing is mandatory before merge

### 3. **User Trust is Currency**
- No dark patterns or dark UX
- No manipulative notifications
- No paywalls on core features
- No data selling or third-party ads
- Transparency in changelog + roadmap

### 4. **Quality Over Speed**
- Shipped bugs delay growth more than features do
- Tests before features
- Performance testing before launch
- Security audit before shipping
- Better to ship fewer features well than many features poorly

---

## 📋 CODE STANDARDS

### Naming Conventions

#### Files & Folders
```
✅ GOOD:
- src/components/notes/NoteEditor.tsx
- src/hooks/useOfflineSync.ts
- src/store/notesStore.ts
- src/types/index.ts
- src/utils/encryption.ts
- src/__tests__/encryption.test.ts

❌ BAD:
- src/NoteEditor.tsx (ambiguous location)
- src/hooks/useSync.ts (too generic)
- src/store.ts (unclear what it stores)
- src/utils/helper.ts (meaningless name)
- tests/ (should be __tests__ collocated with source)
```

#### Variables & Functions
```typescript
✅ GOOD:
const encryptedNoteContent = encrypt(note.content);
const isSyncPending = syncQueue.length > 0;
const MAX_OFFLINE_STORAGE_MB = 50;
function deriveEncryptionKey(password: string): Promise<Uint8Array>

❌ BAD:
const enc = encrypt(n.c);
const pending = q.length > 0;
const MAX = 50;
function derive(p: string): Promise<any>
```

#### TypeScript Interfaces
```typescript
✅ GOOD:
interface Note {
  id: UUID;
  userId: UUID;
  title: string;
  content: string;
  createdAt: ISO8601DateTime;
}

interface SyncQueueItem {
  id: UUID;
  action: 'create' | 'update' | 'delete';
  resourceType: 'note' | 'task' | 'reminder';
  payload: Record<string, unknown>;
}

❌ BAD:
interface N { ... }
type SyncItem = any;
let data: unknown; // avoid
```

### TypeScript Rules

```typescript
✅ ENFORCED:
- No `any` types (use `unknown` if necessary, then narrow)
- All function parameters must have types
- All return types must be explicit (no implicit any)
- Interfaces for data structures, types for unions
- Generics for reusable components/hooks

❌ FORBIDDEN:
- any
- implicit any
- ! non-null assertions (except in tests/UI)
- as type assertions in production code
```

### Component Rules

```typescript
✅ GOOD:
// Functional component with hooks
interface NoteEditorProps {
  noteId: UUID;
  onSave?: (note: Note) => void;
}

export function NoteEditor({ noteId, onSave }: NoteEditorProps) {
  const [content, setContent] = useState('');
  const { mutate: updateNote } = useNotes();
  
  useEffect(() => {
    // Effect body
  }, [noteId]); // Dependency array always explicit
  
  return <div>...</div>;
}

❌ BAD:
// Class component (avoid for new code)
// Props via `this.props` (implicit typing)
// useState without TypeScript types
// useEffect without dependency array
// Components > 300 lines (split into smaller)
```

### Hook Rules

```typescript
✅ ENFORCED:
- Custom hooks start with `use`
- Hooks only called in components or other hooks (no conditional calls)
- Dependencies array always explicit (no implicit []'s)
- Return consistent shapes
- Hooks under 200 lines (split if longer)
- No external dependencies in hook internals (inject via parameters)

❌ FORBIDDEN:
- Calling hooks conditionally
- Missing dependency array
- Using hooks in regular functions
- Hooks with side effects in render path
```

### Import Organization

```typescript
✅ ENFORCED ORDER:
// 1. React & external libraries
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal absolute imports
import { useNotes } from '@/hooks/useNotes';
import { Note } from '@/types';

// 3. Relative imports
import { NoteCard } from './NoteCard';

// 4. Styles
import styles from './NoteList.module.css';

❌ BAD:
// Mixed order
// Unused imports
// 'import *' (except barrel exports)
```

---

## 🧪 TESTING STANDARDS

### Test Coverage Requirements

```
MINIMUM THRESHOLDS:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

PRIORITY TESTING:
🔴 CRITICAL (100% coverage required):
  - Encryption/decryption functions
  - Sync queue logic (conflict resolution)
  - RLS policies (database security)
  - Auth flows
  - Payment processing (if added)

🟠 HIGH (80%+ coverage):
  - API calls (with mocked responses)
  - State management (Zustand stores)
  - Custom hooks
  - Utility functions
  - Component business logic

🟡 MEDIUM (60%+ coverage):
  - UI components
  - Form validation
  - Navigation

🟢 LOW (can skip):
  - Style-only components
  - Third-party wrappers
```

### Test File Structure

```typescript
✅ GOOD:
// src/utils/encryption.ts
export async function deriveKey(password: string): Promise<Uint8Array> { ... }

// src/utils/__tests__/encryption.test.ts
import { deriveKey, encrypt, decrypt } from '../encryption';

describe('Encryption Utils', () => {
  describe('deriveKey', () => {
    it('should derive consistent key from same password', async () => {
      const key1 = await deriveKey('password123');
      const key2 = await deriveKey('password123');
      expect(key1).toEqual(key2);
    });

    it('should derive different key from different password', async () => {
      const key1 = await deriveKey('password123');
      const key2 = await deriveKey('wrongpassword');
      expect(key1).not.toEqual(key2);
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt text correctly', async () => {
      const plaintext = 'secret message';
      const { ciphertext, nonce } = encrypt(plaintext, key);
      const decrypted = decrypt(ciphertext, nonce, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should fail gracefully with wrong key', async () => {
      const { ciphertext, nonce } = encrypt('secret', key1);
      expect(() => decrypt(ciphertext, nonce, key2)).toThrow('Decryption failed');
    });
  });
});

❌ BAD:
// Tests in separate test folder
// Test files not collocated with source
// Mock data hardcoded (use factories)
// Tests > 300 lines
// No describe blocks
```

### E2E Test Rules

```typescript
✅ ENFORCED:
// Use Cypress/Playwright
// Test happy paths + edge cases
// Mock API responses (don't test Supabase in E2E)
// Use data-testid for element selection
// Each test is independent (no shared state)
// Clear test names describing user action

describe('Create Note Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'password');
  });

  it('should create a note and save to Supabase', () => {
    cy.contains('New Note').click();
    cy.get('[data-testid="note-title"]').type('My Note');
    cy.get('[data-testid="note-content"]').type('Content here');
    cy.get('[data-testid="save-button"]').click();
    
    cy.contains('Synced').should('be.visible');
  });

  it('should show offline indicator when network fails', () => {
    cy.intercept('POST', '**/rest/v1/notes', { forceNetworkError: true });
    cy.contains('New Note').click();
    cy.get('[data-testid="note-title"]').type('Offline Note');
    
    cy.contains('Offline').should('be.visible');
  });
});

❌ BAD:
// Testing implementation details
// Relying on element text (use data-testid)
// Tests waiting arbitrary times
// Shared test state/fixtures
// Testing Supabase directly (too slow)
```

---

## 🏗️ ARCHITECTURE RULES

### Layering (Must Respect)

```
UI LAYER (Components)
    ↓ (uses hooks)
LOGIC LAYER (Custom Hooks)
    ↓ (uses services)
SERVICE LAYER (API, Auth, IndexedDB)
    ↓ (uses)
DATA LAYER (Supabase, IndexedDB drivers)

RULES:
✅ UI can only use hooks
✅ Hooks can use services
✅ Services can use data layer
❌ UI cannot directly use services
❌ Services cannot import components
❌ Circular dependencies forbidden
```

### State Management Rules

```typescript
✅ USE ZUSTAND FOR:
- UI state (sidebar open/closed, theme, selected note)
- User preferences (font size, theme)
- Global filters (active collection, tag filters)

✅ USE REACT QUERY FOR:
- Server state (notes, reminders, tasks from Supabase)
- Async operations (create, update, delete)
- Caching and deduplication

✅ USE USESTATE FOR:
- Form state (input values during typing)
- Local component state (modal open, hover states)
- Temporary UI state (loading, error messages)

❌ DON'T:
- Mix multiple state management solutions
- Store server data in Zustand
- Store form state in React Query
- Overuse context API
```

### Error Handling Rules

```typescript
✅ ENFORCED:
// Every async function must handle errors
async function createNote(note: Note): Promise<Note | null> {
  try {
    const response = await supabase.from('notes').insert([note]);
    if (response.error) {
      console.error('Failed to create note:', response.error);
      throw new Error(`Create note failed: ${response.error.message}`);
    }
    return response.data[0];
  } catch (error) {
    // Log with context
    logger.error('createNote failed', { note, error });
    // Rethrow or return null (be consistent)
    throw error;
  }
}

✅ USER-FACING ERRORS:
- Clear, actionable messages
- Suggest action (retry, check connection, etc.)
- Log full error for debugging
- Toast notification + optional error modal

❌ FORBIDDEN:
- Silent failures
- console.log in production (use logger)
- Generic "Something went wrong"
- Unhandled promise rejections
```

---

## 🔐 SECURITY RULES

### Authentication & Authorization

```typescript
✅ ENFORCED:
- All API calls include Supabase auth token
- RLS policies checked on every database query
- Tokens refreshed automatically
- Session timeout after 24h inactivity
- Device fingerprinting for "remember device"

SUPABASE RLS POLICIES REQUIRED:
CREATE POLICY "users_read_own_notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_create_notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

❌ FORBIDDEN:
- Storing tokens in localStorage (use httpOnly cookie)
- Client-side authorization (always verify on server)
- Hardcoded API keys in code
- Skipping RLS in any table
```

### Encryption Rules

```typescript
✅ ENFORCED:
- All offline data encrypted with AES-256-GCM
- Key derived from password (Argon2, not MD5)
- Nonce/IV generated randomly for each encryption
- Encryption key never logged or leaked
- Use established crypto libraries (TweetNaCl.js, not homemade crypto)

AUDIT BEFORE SHIPPING:
- Crypto review by 2nd engineer
- Penetration testing
- Dependency audit (no old/unmaintained crypto libs)
- Key rotation plan documented

❌ FORBIDDEN:
- Storing passwords in any form
- Unencrypted sensitive data
- Reusing nonces
- Custom encryption implementations
- Hardcoding encryption keys
```

### API Security

```typescript
✅ ENFORCED:
- All endpoints require authentication
- Rate limiting: 100 requests/minute per user
- Input validation on all fields
- SQL injection protection (parameterized queries)
- CORS properly configured
- CSRF tokens for state-changing requests
- Content Security Policy headers

REQUEST VALIDATION:
function validateCreateNoteRequest(data: unknown): Note {
  if (!data || typeof data !== 'object') throw new Error('Invalid request');
  const { title, content, collectionId } = data as Record<string, unknown>;
  
  if (typeof title !== 'string' || title.length === 0 || title.length > 500) {
    throw new Error('Title must be 1-500 characters');
  }
  if (typeof content !== 'string' || content.length > 100000) {
    throw new Error('Content must be < 100k characters');
  }
  return { title, content, collectionId };
}

❌ FORBIDDEN:
- Trusting user input
- Accepting unvalidated data from clients
- Storing passwords in plain text
- Logging sensitive data (passwords, auth tokens)
```

---

## 📊 PERFORMANCE RULES

### Performance Budgets (Hard Limits)

```
CRITICAL METRICS:
- Initial load: < 1.5s (Time to Interactive)
- Search latency: < 100ms (for 10k notes)
- Note list render: < 300ms (for 1000 notes)
- Encryption/decryption: < 50ms (per note)
- Sync batch: < 2s (for 100 pending changes)
- Memory usage: < 50MB (extension size)

MONITORING:
// Use Chrome DevTools Performance tab before commit
// Run Lighthouse audit (target: 90+ Performance score)
// Monitor real user metrics (CrUX, Web Vitals)

IF EXCEEDING BUDGET:
- Block merge until fixed
- Create performance improvement ticket
- Investigate root cause (large dep? unoptimized query?)
```

### React-Specific Rules

```typescript
✅ ENFORCED:
// Lazy load components
const AnalyticsDashboard = React.lazy(() => import('./AnalyticsDashboard'));

// Virtual scrolling for large lists (1000+ items)
import { FixedSizeList } from 'react-window';

// Memoize expensive components
const NoteCard = React.memo(({ note }: { note: Note }) => {
  return <div>{note.title}</div>;
});

// Use useCallback for event handlers passed to memoized children
const handleDelete = useCallback((id: string) => {
  deleteNote(id);
}, [deleteNote]);

// Avoid inline objects/functions in render
// ❌ BAD: <Component style={{ color: 'red' }} onClick={() => doThing()} />
// ✅ GOOD: const style = { color: 'red' }; const handleClick = () => doThing();

BUNDLE SIZE AUDITS:
npm run analyze-bundle (weekly)
If any single dependency > 100KB minified: justify or replace
Total bundle size: < 300KB gzipped
```

### Database Query Rules

```sql
✅ ENFORCED:
-- Always use indexes for WHERE clauses
CREATE INDEX idx_notes_user_id ON notes(user_id);

-- Paginate large result sets
SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20 OFFSET 0;

-- Use EXPLAIN ANALYZE for slow queries
EXPLAIN ANALYZE SELECT * FROM notes WHERE user_id = $1 AND is_archived = false;

-- Avoid N+1 queries (fetch related data in one query)
SELECT n.*, COUNT(t.id) as tag_count 
FROM notes n
LEFT JOIN note_tags nt ON n.id = nt.note_id
LEFT JOIN tags t ON nt.tag_id = t.id
WHERE n.user_id = $1
GROUP BY n.id;

❌ FORBIDDEN:
- SELECT * (specify columns)
- Queries without WHERE clause for large tables
- Subqueries instead of JOINs
- N+1 queries
- Unindexed searches
- Real-time subscriptions on large tables (only for small data)
```

---

## 📝 GIT & COMMIT STANDARDS

### Commit Message Format

```
Format: <type>(<scope>): <subject>

<body>

<footer>

EXAMPLES:
✅ GOOD:
feat(notes): add bidirectional link support
  - Support [[note-link]] syntax in editor
  - Show backlinks when viewing note
  - Add link creation modal
  
  Fixes #123

✅ GOOD:
fix(offline): handle sync queue conflicts on reconnect
  - Implement server-side wins strategy
  - Flag conflicts for user review
  - Add conflict resolution modal
  
  Fixes #456

❌ BAD:
- "fix bug" (no scope, vague)
- "wip" (never commit WIP)
- "asdf" (meaningless)
- All caps (NOTEWISE-123: THIS IS THE FIX)

TYPES:
- feat: New feature
- fix: Bug fix
- perf: Performance improvement
- docs: Documentation
- test: Test addition/modification
- refactor: Code refactoring (no behavior change)
- chore: Dependencies, tooling
- ci: CI/CD changes
```

### Branch Naming

```
Format: <type>/<ticket-id>-<short-description>

✅ GOOD:
- feat/123-bidirectional-links
- fix/456-offline-sync-conflicts
- perf/789-optimize-note-search
- docs/migrate-to-typescript

❌ BAD:
- feature (too vague)
- NOTEWISE-123 (no type)
- my-cool-branch (no ticket)
- main-fix (reserved branch name)
```

### Pull Request Rules

```
✅ ENFORCE:
- Every PR linked to GitHub issue/ticket
- PR description includes "Why" + "What" + "How"
- All tests passing (CI must be green)
- Code coverage not decreased
- Performance budget not exceeded
- At least 1 approval from code owner
- Squash commits before merge (clean history)

PR TEMPLATE:
## Description
Why are we making this change?

## Related Issue
Fixes #123

## Changes
- What changed?
- New features? Breaking changes?

## Testing
How was this tested?
- [ ] Added unit tests
- [ ] Added E2E tests
- [ ] Manual testing steps:

## Performance
- [ ] No performance regression
- [ ] Bundle size checked
- [ ] Database queries optimized

## Checklist
- [ ] TypeScript compiles
- [ ] Tests pass
- [ ] No console errors
- [ ] Updated documentation

❌ FORBIDDEN:
- Merging without approval
- Merging with failing tests
- Merging without peer review
- Large PRs (> 400 lines)
```

---

## 🚀 DEPLOYMENT RULES

### Pre-Deployment Checklist

```
SECURITY:
☑ Security audit completed
☑ No hardcoded secrets
☑ Environment variables configured
☑ RLS policies tested
☑ Auth flows tested
☑ Encryption verified

QUALITY:
☑ All tests passing
☑ Code coverage not decreased
☑ TypeScript compiles (no any)
☑ Lint rules pass
☑ Performance budget met
☑ Bundle size analyzed

FUNCTIONALITY:
☑ Feature works offline
☑ Feature works online
☑ Sync works correctly
☑ Error messages are clear
☑ Logging is appropriate (no sensitive data)
☑ UI is accessible (WCAG 2.1 AA)

DATABASE:
☑ Migrations tested locally
☑ Data backup created
☑ Rollback plan documented
☑ Performance impact assessed

DOCUMENTATION:
☑ README updated
☑ API documentation updated
☑ Changelog updated
☑ User-facing changes documented
```

### Version Numbering (Semantic Versioning)

```
Format: MAJOR.MINOR.PATCH-prerelease+build

RULES:
✅ MAJOR (0.0.0): Breaking changes
✅ MINOR (0.1.0): New features (backward compatible)
✅ PATCH (0.1.1): Bug fixes (backward compatible)
✅ prerelease: alpha, beta, rc (0.1.0-beta.1)

EXAMPLES:
- 0.1.0: MVP launch
- 0.2.0: Widgets added
- 0.2.1: Bug fix in pomodoro
- 1.0.0: Production release
- 1.0.0-beta.1: Testing before major release

CHANGELOG FORMAT:
## [0.2.0] - 2024-01-15
### Added
- Pomodoro timer widget
- Reading list widget

### Fixed
- Offline sync conflicts

### Changed
- Improved note search performance
```

### Rollback Plan

```
IF CRITICAL BUG FOUND POST-DEPLOYMENT:

IMMEDIATE (within 5 minutes):
1. Revert commit from main
2. Publish patch release
3. Notify users in-app
4. Post status update

SHORT-TERM (within 24 hours):
1. Root cause analysis
2. Fix in separate branch
3. Full testing before redeployment
4. Postmortem with team

PREVENTION:
- Canary deployments (10% users first)
- Feature flags for new features
- Staged rollout (no big bang)
```

---

## 📚 DOCUMENTATION STANDARDS

### Code Comments

```typescript
✅ GOOD:
/**
 * Derives encryption key from password using Argon2
 * @param password - User's password
 * @param salt - Optional salt (generates if not provided)
 * @returns 32-byte encryption key
 */
async function deriveKey(password: string, salt?: string): Promise<Uint8Array> {
  // Argon2 parameters: time=2, memory=65536, parallelism=1
  // Chosen for balance between security and performance
  const key = await argon2(password, salt || generateSalt());
  return key;
}

✅ BLOCK COMMENT (complex logic):
// Conflict resolution strategy: server-side wins
// When user has offline note and server has newer version:
// 1. Fetch server version
// 2. Mark local version as conflicted
// 3. Show user comparison UI
// 4. Allow user to choose which version to keep
// See RFC-001 for detailed spec

❌ BAD:
// i variable (meaningless)
// TODO: fix this later (no ticket reference)
// This function is used (already evident from code)
// Generated by ChatGPT (irrelevant)
```

### README Standards

```markdown
# Notewise

[1-2 line description]

## Quick Start
[How to run locally in 5 minutes]

## Architecture
[System diagram + explanation]

## Development
[How to contribute]

## Testing
[How to run tests]

## Deployment
[How to deploy to production]

## Troubleshooting
[Common issues + solutions]

## License
[MIT or similar]
```

### ADR (Architecture Decision Record)

```markdown
# ADR-001: Use Zustand for Client State Management

## Status
Accepted

## Context
We need client state management for UI state, preferences, and local caching.
Considered Redux, Recoil, Jotai, Zustand.

## Decision
Use Zustand for simplicity and minimal boilerplate.

## Consequences
✅ Less boilerplate than Redux
✅ Good TypeScript support
✅ Easy to test
❌ Smaller ecosystem than Redux
❌ Less mature than Redux

## Alternatives Considered
- Redux: Too much boilerplate
- Recoil: Experimental API
- Jotai: Similar to Zustand but less proven

---

Create ADR for:
- Technology choices (React Query, Supabase, etc.)
- Architectural decisions (offline-first, encryption approach)
- Major refactors (splitting components, moving logic)
```

---

## 👥 TEAM COLLABORATION RULES

### Code Review Standards

```
REVIEWER CHECKLIST:

☑ LOGIC & CORRECTNESS:
  - Does code do what commit message says?
  - Are there edge cases missed?
  - Are error cases handled?
  - Is performance acceptable?

☑ SECURITY:
  - No hardcoded secrets
  - Auth properly checked
  - Input validation present
  - No SQL injection vulnerability
  - Encryption used correctly

☑ TESTING:
  - Tests cover happy path + edge cases
  - Tests would catch this bug if it existed
  - Mocking is appropriate

☑ CODE QUALITY:
  - TypeScript no `any`
  - Naming is clear
  - No code duplication
  - Follows project conventions
  - Comments explain why, not what

☑ DOCUMENTATION:
  - Updated README if needed
  - Updated CHANGELOG
  - Comments for complex logic
  - Types are explicit

REVIEW ETIQUETTE:
✅ Ask questions: "Why did you choose X over Y?"
✅ Suggest improvements: "Consider using Z instead"
✅ Acknowledge good work: "Nice optimization!"
❌ Don't approve without reading code
❌ Don't nitpick style (autoformat handles it)
❌ Don't demand changes without explanation
```

### Standup & Sync

```
DAILY STANDUP (15 min):
- What did I ship yesterday?
- What am I shipping today?
- What blockers do I have?

WEEKLY SYNC (30 min):
- Review metrics (DAU, bugs, PRs)
- Discuss roadmap for next week
- Identify blockers early
- Celebrate wins

MONTHLY REVIEW:
- Retrospective: What went well? What could be better?
- Metrics review: Are we on track?
- Tech debt assessment
- Team feedback round
```

### Onboarding New Developers

```
DAY 1:
☑ Clone repo, run locally
☑ Read README + architecture docs
☑ Set up Supabase locally
☑ Run tests (should all pass)

WEEK 1:
☑ Make first small PR (fix typo, improve doc)
☑ Get code review feedback
☑ Review 2 open PRs (learn patterns)
☑ Pick small bug to fix

WEEK 2-4:
☑ Implement small feature
☑ Complete PR review process
☑ Pair program with 1 team member
☑ Set up dev environment exactly

WEEK 4+:
☑ Implement medium feature
☑ Own part of codebase (be code reviewer)
☑ Write documentation for your domain
```

---

## 🎯 METRICS & MONITORING

### Development Metrics (Track Weekly)

```
CODE QUALITY:
- Test coverage: Target 80%+ (track per file)
- Type coverage: 100% (npm run type-check)
- Lint errors: 0 (before merge)
- Bundle size: <300KB gzipped (per release)

TEAM VELOCITY:
- PRs merged per week (target: 5-10)
- Time to merge (target: <24h)
- Code review turn-around (target: <24h)
- Bug rate (target: <5% regressions)

PERFORMANCE:
- Page load time: <1.5s (before merge)
- Search latency: <100ms (before merge)
- Encryption time: <50ms (before merge)

USER HEALTH:
- DAU (daily active users)
- Retention D7 (7-day retention)
- Retention D30 (30-day retention)
- Notes created per day
- Plugin installs
- Error rate (target: <0.1%)
```

### Dashboard to Track

```
Create weekly metrics report:

ENGINEERING:
- PRs merged: 8
- Test coverage: 82%
- Bugs found: 2
- Performance incidents: 0

PRODUCT:
- DAU: 1,250 (↑15% WoW)
- New users: 280
- Retention D7: 38%
- Notes created: 12.4k
- Plugin installs: 45

HEALTH:
- Downtime: 0 minutes
- Error rate: 0.02%
- Support tickets: 3
- Critical bugs: 0
```

---

## 🚨 INCIDENT RESPONSE

### Bug Severity Levels

```
🔴 CRITICAL (Fix immediately):
- Data loss
- Security vulnerability
- Complete feature broken
- App crash on startup
- Unauthorized access

🟠 HIGH (Fix within 24h):
- Feature partially broken
- Serious performance issue
- Data corruption (non-permanent)
- Major UI bug affecting usability

🟡 MEDIUM (Fix within 1 week):
- Minor feature bug
- Cosmetic UI issues
- Performance degradation
- Typos in UI

🟢 LOW (Fix when possible):
- Wishlist items
- Nice-to-have improvements
- Clarifications in docs
```

### Incident Checklist

```
CRITICAL BUG FOUND:

IMMEDIATE (0-5 min):
☑ Create GitHub issue marked CRITICAL
☑ Notify team in Slack #incidents
☑ Assess impact (how many users affected?)
☑ Start investigating root cause

SHORT-TERM (5-30 min):
☑ Reproduce bug locally
☑ Identify root cause
☑ Create hotfix branch
☑ Write test that catches this bug
☑ Code review hotfix (expedited, 1 person)

DEPLOYMENT (30-60 min):
☑ Deploy hotfix to production
☑ Monitor metrics (errors should drop)
☑ Post status update to users

POST-INCIDENT (next day):
☑ Root cause analysis document
☑ Why did we not catch this in tests?
☑ What's the permanent fix?
☑ Team retrospective (30 min)
☑ Action items to prevent recurrence
```

---

## ✅ WEEKLY SUCCESS CHECKLIST

Every Friday, verify:

```
ENGINEERING:
☑ All PRs reviewed + merged
☑ All tests passing
☑ No console errors in dev
☑ Type coverage 100%
☑ Bundle size analyzed
☑ Performance monitored
☑ Security audit done
☑ Documentation updated

PRODUCT:
☑ Metrics reviewed
☑ DAU trending up (or stable if early)
☑ Retention D7 meets target
☑ No critical bugs
☑ Roadmap on track
☑ Stakeholders updated

TEAM:
☑ No blockers for next week
☑ Code review turn-around < 24h
☑ Team morale check-in
☑ Retrospective notes captured
☑ Next week priorities clear
```

---

## 🎓 LEARNING & GROWTH

### Required Reading (Onboarding)

```
ARCHITECTURE:
- "System Design Primer" (real-world scaling)
- "Building Secure & Reliable Systems" (Google SRE)

SECURITY:
- "Cryptography Engineering" (Ferguson, Schneier)
- OWASP Top 10
- "The Practical Guide to Cyber Security" (minimum)

REACT:
- "Epic React" (Kent C. Dodds)
- React docs (especially hooks)
- "Thinking in React"

DATABASE:
- PostgreSQL official docs (indexing chapter)
- "Database Design Manual" (Lightstone)

CODE QUALITY:
- "Clean Code" (Robert Martin)
- "The Pragmatic Programmer"
- "Refactoring" (Martin Fowler)
```

### Code Review Learning

```
EVERY PR REVIEW:
- Learn from how others solve problems
- Ask questions if you don't understand
- Note patterns to adopt
- Suggest improvements respectfully

EVERY MONTH:
- Discuss 1 architecture decision
- Share 1 learning with team
- Code review someone else's domain
```

---

## 📌 NON-NEGOTIABLE RULES (DO OR DIE)

```
🔴 CRITICAL RULES (Never break):

1. NO SHIPPING WITHOUT TESTS
   If feature has no test, it doesn't exist

2. NO HARDCODED SECRETS
   .env files only, never in code

3. NO UNENCRYPTED SENSITIVE DATA
   All offline data must be encrypted

4. NO SILENT FAILURES
   Every error must be handled + logged

5. NO DATA LOSS
   Soft deletes only, never immediate hard delete

6. NO BREAKING CHANGES WITHOUT MIGRATION
   Always provide upgrade path for users

7. NO DARK PATTERNS
   Never manipulate users into actions

8. NO DEPENDENCIES WITHOUT JUSTIFICATION
   Every dependency must have clear reason

9. NO MERGING WITHOUT REVIEW
   Second pair of eyes always

10. NO DEPLOYING AFTER WORKING HOURS
    Always deploy during business hours (for support)
```

---

## 🎬 CONCLUSION

These rules exist to:
1. **Prevent disasters**: Security, data loss, bugs in production
2. **Enable scale**: Clean code, good tests, documentation
3. **Protect users**: Privacy, transparency, reliability
4. **Empower team**: Clear expectations, growth opportunities
5. **Ensure success**: Ship quality > ship fast

**Success = Quality + Speed + Trust. These rules enable all three.**

