# Notewise: Feature Roadmap & Unique Selling Points

## EXECUTIVE SUMMARY

**Notewise** is a free, privacy-first Chrome extension that transforms your browser into a minimalist, Apple-designed note-taking hub. Unlike competitors (Notion, Obsidian, Apple Notes), it combines:

1. **Offline-first** with end-to-end encryption (notes never leave your device unencrypted)
2. **Real-time sync** to Supabase when you reconnect
3. **Zero login friction** (magic link authentication)
4. **Plugin ecosystem** (extend with Slack, GitHub, Calendar integrations)
5. **Gamification** that doesn't feel pushy (streaks, badges, analytics)
6. **Pomodoro + task + reminder widgets** all in one place
7. **Free forever** (monetize later with Pro tier for advanced features)

### Why It Wins

| Feature | Notewise | Notion | Obsidian | Apple Notes |
|---------|----------|--------|----------|-------------|
| Offline-first | ✅ Encrypted | ❌ | ✅ | ❌ |
| Real-time sync | ✅ Automatic | ✅ Automatic | ❌ Manual | ✅ Automatic |
| Free forever | ✅ | ❌ ($10/mo) | ❌ ($89 one-time) | ✅ Limited |
| Plugin ecosystem | ✅ Open | ✅ Limited | ✅ Limited | ❌ |
| Productivity widgets | ✅ Built-in | ❌ Addon required | ❌ | ❌ |
| Browser extension | ✅ | ❌ | ❌ | ❌ |
| Encryption | ✅ E2E | ❌ | ✅ Optional | ❌ |

---

## FEATURES BY PRIORITY (MoSCoW)

### MUST HAVE (MVP - Weeks 1-4)

#### 1. Core CRUD Operations
- **Create notes** with title + content (markdown support)
- **Read notes** with infinite scroll + search
- **Update notes** with real-time sync (optimistic updates)
- **Delete notes** (soft delete = 30-day recovery window)
- **Data model**: Full text search, word/char count, reading time

#### 2. Offline-First Architecture
- **IndexedDB storage**: Full note database synced to local device
- **Encryption**: User's password → 32-byte key (via Argon2/PBKDF2) → AES-256-GCM
- **Sync queue**: Track offline changes, batch sync on reconnect
- **Conflict resolution**: Server-side wins + visual flagging for user review
- **Sync indicators**: Toast notifications showing status + error messages

#### 3. Authentication
- **Magic link login**: Email → 6-digit code (Supabase Auth)
- **Device memory**: "Remember this device" (30-day session)
- **Logout**: Clear encryption key from memory

#### 4. Collections & Tags
- **Collections**: Nested folder hierarchy (parent-child relationships)
- **Tags**: Custom user tags + quick-access sidebar
- **Note organization**: Link note to collection + multiple tags
- **Smart tagging**: Auto-suggest tags based on content (optional, MVP = manual)

#### 5. Basic UI (Apple Design)
- **Color palette**: Neutral grays + semantic colors only
- **Typography**: SF Pro Display (headings) + SF Pro Text (body)
- **Dark mode**: Built-in, respects system preference
- **Responsive**: Optimized for 380px (mobile) to 1920px (desktop)
- **Components**: Sidebar, note list, editor, modals (all shadcn/ui)

#### 6. Chrome Extension Scaffolding
- **Manifest V3**: Declare permissions (storage, alarms, notifications)
- **Popup UI**: Quick capture modal (Cmd/Ctrl+Shift+N)
- **New tab override**: Load app as new tab page (optional MVP feature)
- **Content script**: (Future: capture web text, create notes from pages)

---

### SHOULD HAVE (Phase 2 - Weeks 5-8)

#### 1. Productivity Widgets
- **Task Widget**: Inline checklist within notes
  - Create/update/delete tasks
  - Mark complete, due dates, recurrence
  - Drag-drop priority reordering
  - Real data: `tasks` table linked to notes
  
- **Pomodoro Timer**: 25-min work / 5-min break
  - Customizable durations
  - Break recommendations
  - Session history (store in `pomodoro_sessions`)
  - Browser notifications on complete
  
- **Reminders Widget**: Schedule alerts for notes
  - Set reminders (1 min to 1 year)
  - Smart times (morning 8am, afternoon 2pm, evening 6pm)
  - Browser + in-app notifications
  - Snooze, complete, delete
  - Real data: `reminders` table with next_due_at

#### 2. Sharing & Collaboration
- **Public share links**: Generate read-only links with optional expiry
- **Encrypted sharing**: Share without account creation
- **Collection sharing**: Share entire folder with permissions
- **Comments**: Read-only users can comment on shared notes
- **Real data**: `share_links`, `share_permissions`, `comments` tables

#### 3. Advanced Search
- **Full-text search**: Supabase FTS on notes content
- **Filters**: By tag, collection, date created, date modified
- **Advanced queries**: title:"meeting" tag:urgent created:>2024-01-01
- **Search history**: Track and resurface frequent searches

#### 4. Keyboard Shortcuts
- **Global hotkey**: Cmd/Ctrl+Shift+N = quick capture
- **In-app shortcuts**:
  - Cmd+K = search
  - Cmd+B = bold (in editor)
  - Cmd+I = italic
  - Cmd+Enter = save & close
  - Tab/Shift+Tab = jump between notes

#### 5. Widget: Reading List
- **Save for later**: Capture URLs, articles, PDFs
- **Reading time estimate**: Auto-calculate from content
- **Sort**: By date, source, reading time
- **Archive**: Mark as read
- **Real data**: `reading_list` table with metadata

#### 6. Analytics Dashboard
- **Stats**: Notes created per day (7/30-day views)
- **Busiest time**: Peak writing hours
- **Tags**: Most-used tags
- **Streaks**: Consecutive days with notes
- **Content metrics**: Longest notes, average word count
- **Real data**: Aggregated from notes + metadata tables

---

### NICE TO HAVE (Phase 3 - Weeks 9-12)

#### 1. Plugin Ecosystem
- **Plugin manifest**: JSON-based (name, version, permissions)
- **Plugin types**:
  - Widget plugins (display in sidebar)
  - Command plugins (slash commands)
  - Integration plugins (external APIs)
- **Official plugins**:
  - Slack: Share notes to Slack, create from messages
  - GitHub: Capture issues as notes
  - Calendar: Show upcoming events
  - Weather: Display forecast
  - Notion: Export notes to Notion
  
- **Developer API**:
  ```javascript
  window.notewise.note.create(title, content, tags)
  window.notewise.note.list(filters)
  window.notewise.note.update(id, updates)
  window.notewise.sync.status() // 'online' | 'offline' | 'syncing'
  ```

#### 2. Gamification (Light-touch)
- **Streak system**: Consecutive days with notes
  - Milestone badges (7, 30, 100-day)
  - Streak recovery: Skip 1 day without losing streak
  - Visual calendar showing activity
  
- **Badges/Achievements**:
  - First note ✨
  - 10 notes 📝
  - 100 notes 🎯
  - Shared 5 notes 🤝
  - 1-week streak 🔥
  
- **Weekly digest**: Friday email summary
  - Notes created, words written, tags used
  - Best-performing notes
  - Pomodoro stats
  
- **Leaderboard** (optional, privacy-respecting):
  - Friend comparison (opt-in)
  - Global leaderboard (anonymized)

#### 3. Advanced Note Features
- **Bidirectional links**: [[note-link]] syntax (like Obsidian)
- **Backlinks**: Show which notes link to current note
- **Note templates**: Pre-built templates (Daily standup, Meeting notes, etc.)
- **Rich media**: Embed YouTube, tweets, images
- **Code highlighting**: Syntax highlighting for code blocks
- **Math rendering**: KaTeX for equations

#### 4. Team Features (Future)
- **Shared workspaces**: Team notes in separate workspace
- **Role-based access**: Owner, editor, viewer
- **Activity log**: See who changed what and when
- **Mentions**: Tag @username to notify

#### 5. AI-Powered (Optional, requires Gemini API)
- **Auto-tagging**: Suggest tags based on content
- **Smart summarization**: Generate summary of long notes
- **Smart reminders**: Suggest optimal reminder times
- **Daily prompt**: Writing prompt based on past notes
- **Duplicate detection**: Find similar notes

#### 6. Export & Import
- **Export formats**: PDF, Markdown, Word (.docx), HTML
- **Export options**: Single note, collection, all notes
- **Import**: From Notion, Obsidian, Evernote
- **Format preservation**: Markdown, code blocks, links

---

## RETENTION & ENGAGEMENT FEATURES

### Streaks System
- **Track daily creation**: Notes created per day
- **Milestones**: 7, 30, 100, 365-day badges
- **Streak recovery**: Miss 1 day without losing streak
- **Visual calendar**: GitHub-style activity graph
- **Leaderboard**: Friend or global comparison (opt-in)

### Weekly Digest Email
**Frequency**: Every Friday, 9 AM user's timezone

**Content**:
- Summary: X notes created, Y words written, Z tags used
- Top notes: Most-viewed, most-shared, longest
- Stats: Writing time, busiest day, focus time
- Reminder: Continue the streak!

### Smart Recommendations
- **Related notes**: Show notes with same tags/keywords
- **Resurfacing**: Prompt to review old notes (monthly)
- **Content ideas**: Suggest notes to elaborate on (< 100 words)
- **Trending topics**: Popular tags across all users (anonymized)

### Notifications
- **Reminder notifications**: Browser alerts + in-app toast
- **Sync notifications**: "Synced ✓", error messages
- **Streak notifications**: "🔥 7-day streak!"
- **Plugin notifications**: Integration activity (e.g., "Added Slack note")

---

## PRICING & MONETIZATION (LONG-TERM)

### Free Tier (Forever Free)
- 100 notes max
- 5 collections
- Basic widgets (task, reminder)
- Community plugins
- Offline sync
- Encryption
- Sharing (read-only)

**Goal**: Maximize adoption, build trust, generate word-of-mouth

### Pro Tier ($9.99/month or $99/year)
- Unlimited notes
- Unlimited collections
- Advanced widgets (Pomodoro, reading list, analytics)
- Early access to new features
- Priority support
- Premium plugins
- Team collaboration (up to 3 users)
- Custom domain for public notes

### Team Tier ($19.99/month per workspace)
- Everything in Pro
- Unlimited team members
- Admin controls
- Team analytics
- Audit logs

**Strategy**: Keep free tier robust to avoid feature walls; charge for power users + teams

---

## ACQUISITION STRATEGY

### Viral Mechanics
1. **Share links**: Every note can be shared; recipients don't need account
2. **Import friends**: See which friends also use Notewise
3. **Social proof**: "X friends use Notewise"
4. **Public notes**: Highlight interesting public notes on landing page

### Marketing Channels
1. **Product Hunt**: Launch week 4-5 with featured widget
2. **Reddit**: r/productivity, r/tools, r/notetaking
3. **Twitter**: Thread on offline-first + privacy
4. **Hacker News**: Technical deep-dive on sync architecture
5. **Indie Hackers**: Maker journey + monthly updates
6. **Content marketing**: Blog on "offline-first note-taking", "why encryption matters"

### Partnerships
- **Productivity communities**: Add to newsletter roundups
- **Dev tools**: Featured in trending extensions
- **Privacy advocates**: Recommend as privacy-first alternative to Notion

---

## TECHNICAL DEBT PREVENTION

### Code Quality
- **Test coverage**: >80% (unit + integration + E2E)
- **Linting**: ESLint + Prettier on commit
- **Type safety**: 100% TypeScript
- **Documentation**: README + inline comments for complex logic

### Performance Budgets
- **Initial load**: <1.5s (including encryption key derivation)
- **Search**: <100ms for 10k notes
- **Sync**: <2s for 100 pending changes
- **Memory**: <50MB extension size (uncompressed)

### Dependency Management
- **Minimal deps**: Only essential libraries (TanStack Query, Zustand, shadcn/ui)
- **Security audit**: npm audit weekly
- **Version pinning**: Lock versions in package-lock.json
- **Deprecation**: Plan for TweetNaCl → WebCrypto API migration

---

## SUCCESS METRICS (12-MONTH TARGETS)

| Metric | 3 Months | 6 Months | 12 Months |
|--------|----------|----------|-----------|
| **DAU** | 1k | 10k | 50k |
| **MAU** | 5k | 50k | 250k |
| **Notes created** | 50k | 500k | 5M |
| **Retention (D7)** | 30% | 40% | 50% |
| **Retention (D30)** | 15% | 25% | 35% |
| **Avg notes/user** | 10 | 30 | 50 |
| **Plugin installs** | 100 | 1k | 5k |
| **Shared notes** | 5% of notes | 15% | 25% |
| **Pro subscribers** | 0 | 50 | 500 |
| **Net Promoter Score** | 40 | 50 | 60 |

---

## COMPETITIVE LANDSCAPE

### Direct Competitors
1. **Notion** ($10/mo)
   - Pros: Powerful, customizable, team-ready
   - Cons: Complex, slow, not offline, not free
   - Notewise edge: Simpler, faster, offline, free

2. **Obsidian** ($89 one-time)
   - Pros: Offline-first, markdown, bidirectional links
   - Cons: Not free, no sync included, steep learning curve
   - Notewise edge: Free, automatic sync, simpler UX

3. **Apple Notes**
   - Pros: Apple ecosystem, seamless sync
   - Cons: Locked to Apple, no plugins, limited features
   - Notewise edge: Cross-platform, plugins, privacy by design

4. **OneNote** (Free)
   - Pros: Free, Microsoft ecosystem
   - Cons: Cluttered UI, not offline-first
   - Notewise edge: Minimalist, offline, plugin ecosystem

### Why Notewise Wins
- **Best of both worlds**: Offline-first (Obsidian) + automatic sync (Notion) + free (Apple Notes)
- **Unique plugin system**: Extend without bloating core
- **Gamification**: Engagement through streaks, not manipulation
- **Privacy-first**: Encryption by default
- **Browser native**: Quick access, global hotkey

---

## RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **User churn (low retention)** | High | Implement weekly digest, streaks, reminders early |
| **Encryption bugs** | Critical | Audit with crypto experts, extensive testing |
| **Sync conflicts** | High | Server-side wins + visible conflict flagging |
| **Large-scale performance** | High | Database indexing, query optimization, load testing |
| **Plugin security** | High | Sandbox iframes, CSP, permission model |
| **Competitor feature creep** | Medium | Focus on unique differentiators (privacy, plugins) |
| **Apple restricts extensions** | Medium | Browser diversity (Firefox, Edge), web app fallback |

---

## LAUNCH TIMELINE

```
Week 1-2:   Setup Supabase, React scaffolding, auth flow
Week 3-4:   Core CRUD, offline sync, encryption
Week 5-6:   Collections, tags, search
Week 7-8:   Task + Pomodoro widgets, basic UI polish
Week 9-10:  Sharing, collaboration, analytics
Week 11-12: Testing, bug fixes, Chrome Web Store submission
Week 13+:   Monitor metrics, iterate based on feedback
```

---

## UNIQUE DIFFERENTIATORS (TL;DR)

1. ✅ **Offline-first with encryption** (Obsidian's strength + Notion's ease)
2. ✅ **Automatic real-time sync** (No manual save)
3. ✅ **Free forever** (No paywall on core features)
4. ✅ **Plugin ecosystem** (Extensible without bloat)
5. ✅ **Browser native** (Fastest access)
6. ✅ **Privacy by default** (User-controlled encryption)
7. ✅ **Gamification done right** (Streaks, not manipulation)
8. ✅ **Apple design** (Feels native, minimalist)
9. ✅ **Productivity widgets** (All in one place)
10. ✅ **Zero login friction** (Magic link, device memory)

---

## NEXT STEPS

1. **Fork the prompt**: Copy chrome-extension-prompt.md into your AI IDE
2. **Set up Supabase**: Create project, run SQL schema
3. **Scaffold React app**: Create app, install dependencies
4. **Start building**: Begin with Week 1-2 tasks (auth + basic CRUD)
5. **Track progress**: Use implementation-guide.md as reference
6. **Test continuously**: Unit + E2E tests from day 1
7. **Iterate**: Weekly sprints, measure metrics

---

## CONCLUSION

Notewise is positioned to disrupt the note-taking space by combining the best of Obsidian (offline-first), Notion (ease of use), and Apple Notes (design + free). By launching free with a robust plugin ecosystem, you build a community of power users who will evangelize the product. The freemium model (Pro tier) provides monetization upside without compromising the core mission: privacy, simplicity, and productivity.

**Build it. Ship it. Iterate.** 🚀

