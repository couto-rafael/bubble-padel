# Graph Report - .  (2026-04-11)

## Corpus Check
- 102 files · ~122,417 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 589 nodes · 736 edges · 87 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Service Layer|API Service Layer]]
- [[_COMMUNITY_Backend Routes & Auth|Backend Routes & Auth]]
- [[_COMMUNITY_Legal & Compliance Docs|Legal & Compliance Docs]]
- [[_COMMUNITY_Dev Pipeline & Agents|Dev Pipeline & Agents]]
- [[_COMMUNITY_Frontend Services & Types|Frontend Services & Types]]
- [[_COMMUNITY_API Fetch Functions|API Fetch Functions]]
- [[_COMMUNITY_Utility Functions|Utility Functions]]
- [[_COMMUNITY_Auth UI Components|Auth UI Components]]
- [[_COMMUNITY_Email Service|Email Service]]
- [[_COMMUNITY_UI Design System|UI Design System]]
- [[_COMMUNITY_React Hooks Layer|React Hooks Layer]]
- [[_COMMUNITY_Beta & User Feedback|Beta & User Feedback]]
- [[_COMMUNITY_Agent Infrastructure|Agent Infrastructure]]
- [[_COMMUNITY_App Shell & AuthContext|App Shell & AuthContext]]
- [[_COMMUNITY_Schedule Utilities|Schedule Utilities]]
- [[_COMMUNITY_Module Group 15|Module Group 15]]
- [[_COMMUNITY_Module Group 16|Module Group 16]]
- [[_COMMUNITY_Module Group 17|Module Group 17]]
- [[_COMMUNITY_Module Group 18|Module Group 18]]
- [[_COMMUNITY_Module Group 19|Module Group 19]]
- [[_COMMUNITY_Module Group 20|Module Group 20]]
- [[_COMMUNITY_Module Group 21|Module Group 21]]
- [[_COMMUNITY_Module Group 22|Module Group 22]]
- [[_COMMUNITY_Module Group 23|Module Group 23]]
- [[_COMMUNITY_Module Group 24|Module Group 24]]
- [[_COMMUNITY_Module Group 25|Module Group 25]]
- [[_COMMUNITY_Module Group 26|Module Group 26]]
- [[_COMMUNITY_Module Group 27|Module Group 27]]
- [[_COMMUNITY_Module Group 28|Module Group 28]]
- [[_COMMUNITY_Module Group 29|Module Group 29]]
- [[_COMMUNITY_Module Group 30|Module Group 30]]
- [[_COMMUNITY_Module Group 31|Module Group 31]]
- [[_COMMUNITY_Module Group 32|Module Group 32]]
- [[_COMMUNITY_Module Group 33|Module Group 33]]
- [[_COMMUNITY_Module Group 34|Module Group 34]]
- [[_COMMUNITY_Module Group 35|Module Group 35]]
- [[_COMMUNITY_Module Group 36|Module Group 36]]
- [[_COMMUNITY_Module Group 37|Module Group 37]]
- [[_COMMUNITY_Module Group 38|Module Group 38]]
- [[_COMMUNITY_Module Group 39|Module Group 39]]
- [[_COMMUNITY_Module Group 40|Module Group 40]]
- [[_COMMUNITY_Module Group 41|Module Group 41]]
- [[_COMMUNITY_Module Group 42|Module Group 42]]
- [[_COMMUNITY_Module Group 43|Module Group 43]]
- [[_COMMUNITY_Module Group 44|Module Group 44]]
- [[_COMMUNITY_Module Group 45|Module Group 45]]
- [[_COMMUNITY_Module Group 46|Module Group 46]]
- [[_COMMUNITY_Module Group 47|Module Group 47]]
- [[_COMMUNITY_Module Group 48|Module Group 48]]
- [[_COMMUNITY_Module Group 49|Module Group 49]]
- [[_COMMUNITY_Module Group 50|Module Group 50]]
- [[_COMMUNITY_Module Group 51|Module Group 51]]
- [[_COMMUNITY_Module Group 52|Module Group 52]]
- [[_COMMUNITY_Module Group 53|Module Group 53]]
- [[_COMMUNITY_Module Group 54|Module Group 54]]
- [[_COMMUNITY_Module Group 55|Module Group 55]]
- [[_COMMUNITY_Module Group 56|Module Group 56]]
- [[_COMMUNITY_Module Group 57|Module Group 57]]
- [[_COMMUNITY_Module Group 58|Module Group 58]]
- [[_COMMUNITY_Module Group 59|Module Group 59]]
- [[_COMMUNITY_Module Group 60|Module Group 60]]
- [[_COMMUNITY_Module Group 61|Module Group 61]]
- [[_COMMUNITY_Module Group 62|Module Group 62]]
- [[_COMMUNITY_Module Group 63|Module Group 63]]
- [[_COMMUNITY_Module Group 64|Module Group 64]]
- [[_COMMUNITY_Module Group 65|Module Group 65]]
- [[_COMMUNITY_Module Group 66|Module Group 66]]
- [[_COMMUNITY_Module Group 67|Module Group 67]]
- [[_COMMUNITY_Module Group 68|Module Group 68]]
- [[_COMMUNITY_Module Group 69|Module Group 69]]
- [[_COMMUNITY_Module Group 70|Module Group 70]]
- [[_COMMUNITY_Module Group 71|Module Group 71]]
- [[_COMMUNITY_Module Group 72|Module Group 72]]
- [[_COMMUNITY_Module Group 73|Module Group 73]]
- [[_COMMUNITY_Module Group 74|Module Group 74]]
- [[_COMMUNITY_Module Group 75|Module Group 75]]
- [[_COMMUNITY_Module Group 76|Module Group 76]]
- [[_COMMUNITY_Module Group 77|Module Group 77]]
- [[_COMMUNITY_Module Group 78|Module Group 78]]
- [[_COMMUNITY_Module Group 79|Module Group 79]]
- [[_COMMUNITY_Module Group 80|Module Group 80]]
- [[_COMMUNITY_Module Group 81|Module Group 81]]
- [[_COMMUNITY_Module Group 82|Module Group 82]]
- [[_COMMUNITY_Module Group 83|Module Group 83]]
- [[_COMMUNITY_Module Group 84|Module Group 84]]
- [[_COMMUNITY_Module Group 85|Module Group 85]]
- [[_COMMUNITY_Module Group 86|Module Group 86]]

## God Nodes (most connected - your core abstractions)
1. `Shared Types` - 20 edges
2. `Express Application Server` - 18 edges
3. `Prisma Client Singleton` - 17 edges
4. `Dev Pipeline Agent (Tech Lead)` - 16 edges
5. `sendEmail()` - 12 edges
6. `emailHeader()` - 12 edges
7. `emailFooter()` - 12 edges
8. `FRONTEND()` - 12 edges
9. `Email Service (Resend)` - 11 edges
10. `Custom Hooks` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Payment Status Flow (PENDINGâ†’PAID/EXPIREDâ†’REFUNDED)` --semantically_similar_to--> `Tournament Status Flow (DRAFTâ†’PUBLISHEDâ†’OPENâ†’CLOSEDâ†’ONGOINGâ†’COMPLETED)`  [INFERRED] [semantically similar]
  docs/compliance_pagamento_3T1.md → README.md
- `SKILL.md â€” Review Pipeline Definition` --semantically_similar_to--> `Review Pipeline Agent (Orchestrator)`  [INFERRED] [semantically similar]
  docs/SKILL.md → agents/review-pipeline.md
- `Product Go/No-Go Launch Criteria` --semantically_similar_to--> `Go/No-Go Criteria: Beta to Public Launch (Task 3.T3)`  [INFERRED] [semantically similar]
  agents/specialists.md → docs/gonogo_3T3.md
- `Pre-Task Sync Protocol` --semantically_similar_to--> `Dev Pipeline Gate 0 â€” Pre-Task Checklist`  [INFERRED] [semantically similar]
  docs/SKILL.md → agents/dev-pipeline.md
- `EmailService Payment Functions (sendPixGerado et al.)` --semantically_similar_to--> `Email Service Functions (sendInscricaoConfirmada et al.)`  [INFERRED] [semantically similar]
  docs/email_pagamento_3T2.md → agents/specialists.md

## Hyperedges (group relationships)
- **Tournament Completion Pipeline** — statussync_job, gamificationservice, tournament_dispatch_resultado, tournament_dispatch_reconciliacao [EXTRACTED 0.95]
- **PIX Payment Flow** — payment_routes, paymentservice, paymentservice_webhook, emailservice [EXTRACTED 0.95]
- **Athlete Gamification Display** — athlete_routes, athlete_achievement_meta, gamification_achievement_catalog [INFERRED 0.75]
- **Tournament Management Tab System** — tabgrupos, tabjogos, tabplayoffs, tabinscricoes, tabfinanceiro [INFERRED 0.90]
- **App Root Provider Stack** — app_tsx, errorboundary, authcontext, toast_component [EXTRACTED 1.00]
- **Tournament-scoped Data Hooks** — usegroups_usegroups, useteams_useteams, useplayoffs_useplayoffs, useschedule_useschedule [INFERRED 0.90]
- **UI Design System v2 Components** — button_button, card_card, badge_badge, avatar_avatar, modal_modal, input_input, spinner_spinner, tabs_pilltabs, emptystate_emptystate, statcard_statcard [EXTRACTED 1.00]
- **Athlete Portal Navigation Flow** — athletedashboard_page, athleteprofile_page, athletesettings_page [INFERRED 0.90]
- **Tournament Management Core Services** — api_tournamentservice, api_teamservice, api_groupservice, api_playoffservice [EXTRACTED 0.95]
- **EditTournament Orchestrates Tab Modules** — edittournament_page, api_tournamentservice, grouputils_calculatecapacity [EXTRACTED 0.95]
- **Go/No-Go Launch Readiness â€” NPS + PIX + Zero Bugs** — gonogo_doc, feedback_beta_gonogo_criteria, kpis_beta_metrics [EXTRACTED 0.95]
- **PIX Payment Ecosystem â€” Compliance + Monetization + Email Notifications** — compliance_pix_flow, monetizacao_pix_flow, email_payment_service_functions [INFERRED 0.85]
- **Full Agent Review Pipeline â€” Dev + Peer Review + Release** — dev_pipeline_agent, review_pipeline_agent, skill_md_7gate_pipeline [EXTRACTED 0.90]

## Communities

### Community 0 - "API Service Layer"
Cohesion: 0.05
Nodes (19): formatDateRange(), parseLocalDate(), DashboardHeader Component, Custom Hooks, getStatusDisplay(), StatusBadge(), OnboardingChecklist Component, ScoreModal Component (+11 more)

### Community 1 - "Backend Routes & Auth"
Cohesion: 0.08
Nodes (33): Achievement Metadata Catalog (Frontend Display), Athlete Routes, JWT Auth Middleware (requireAuth), Auth Routes (Register/Login), Club Routes, Email Service (Resend), Global Error Handler Middleware, Achievement Catalog (Service) (+25 more)

### Community 2 - "Legal & Compliance Docs"
Cohesion: 0.07
Nodes (36): CDC Art. 49 â€” Right of Withdrawal, LGPD Payment Data Rules, Payment Compliance & Refund Policy (Task 3.T1), Payment Status Flow (PENDINGâ†’PAID/EXPIREDâ†’REFUNDED), PIX Payment Flow (Atletaâ†’QR Codeâ†’Clube), Refund Policy (48h rule, 5 business days), Email: Pagamento Confirmado, Payment Email Templates (Task 3.T2) (+28 more)

### Community 3 - "Dev Pipeline & Agents"
Cohesion: 0.08
Nodes (35): Dev Pipeline Agent (Tech Lead), Dev Pipeline Gate 0 â€” Pre-Task Checklist, Dev Pipeline Gate 1 â€” Implementation Plan, Dev Pipeline Gate 2 â€” Self-Review Checklist, Dev Pipeline Gate 3 â€” Delivery and Validation, MCP GitHub Integration, MCP Railway Integration (Future Evaluation), api.ts â€” Backend Communication Service (+27 more)

### Community 4 - "Frontend Services & Types"
Cohesion: 0.1
Nodes (26): GroupService, PlayoffMatchData Interface, PlayoffService, TeamService, TournamentService, ClubDashboard Page, ClubSettings Page, CreateTournament Page (+18 more)

### Community 5 - "API Fetch Functions"
Cohesion: 0.09
Nodes (11): authHeaders(), fetchProfile(), fetchTournaments(), AthleteHeader Component, authHeaders(), getProfile(), getStats(), getTournaments() (+3 more)

### Community 6 - "Utility Functions"
Cohesion: 0.08
Nodes (5): calculateFees(), generateDaysBetween(), getSelectedPaymentMethods(), handleDateChange(), validateDates()

### Community 7 - "Auth UI Components"
Cohesion: 0.09
Nodes (11): AuthModal Component, Footer Component, MobileMenu Component, PaymentModal Component, TabFinanceiro Component, formatDateRange(), mapPublicTournament(), normalizeSport() (+3 more)

### Community 8 - "Email Service"
Cohesion: 0.24
Nodes (25): emailFooter(), emailHeader(), FRONTEND(), sendConviteLiga(), sendConviteLigaExterno(), sendEmail(), sendEmailCampeao(), sendEmailEliminadoGrupos() (+17 more)

### Community 9 - "UI Design System"
Cohesion: 0.09
Nodes (15): Avatar Component, Badge Component, StatusBadge Component, Button Component, Button Inline Spinner, Card(), EmptyState(), Input Component (+7 more)

### Community 10 - "React Hooks Layer"
Cohesion: 0.1
Nodes (15): Hooks Barrel Index, ClubService (used in useClub), useClub(), GroupService (used in useGroups), recalculateStandings Utility, useGroups(), PlayoffService (used in usePlayoffs), usePlayoffs() (+7 more)

### Community 11 - "Beta & User Feedback"
Cohesion: 0.13
Nodes (17): Club Feedback Cadence (D+3, D+7, D+14), Beta Feedback Process (Task 2.T4), Beta Go/No-Go Criteria (NPSâ‰¥7, 3 complete tournaments, 0 critical bugs), Beta NPS Collection Process, Go/No-Go Criterion 1 â€” NPS â‰¥ 7, Go/No-Go Criterion 2 â€” 3+ Complete Tournaments No Critical Bug, Go/No-Go Criterion 3 â€” 1+ Real PIX Payment, Go/No-Go Criterion 4 â€” Zero Critical Bugs Last 2 Weeks (+9 more)

### Community 12 - "Agent Infrastructure"
Cohesion: 0.13
Nodes (16): MCP Infrastructure Setup, MCP Figma Integration, Gamification Features Backlog (badges, trophy room, ranking), Mobile App Evaluation (PWA vs React Native), Sprint 5+ Backlog (Pending Items Post-Launch), Technical Debt Items (Sprint 1-2), New Tournament Formats (Super 8, Round Robin, Americano, etc.), Achievements System (14 achievements, 4 categories, 5 tiers) (+8 more)

### Community 13 - "App Shell & AuthContext"
Cohesion: 0.15
Nodes (5): App (Root Component), AuthContext, ErrorBoundary Component, Main Entry Point, Toast Provider Component

### Community 14 - "Schedule Utilities"
Cohesion: 0.31
Nodes (9): autoSchedulePlayoffMatches(), bracketPositions(), generateAutoSchedule(), generateBracketMatches(), generateSlots(), minutesToTime(), nextPow2(), shuffle() (+1 more)

### Community 15 - "Module Group 15"
Cohesion: 0.42
Nodes (9): awardLeaguePoints(), awardTrophies(), buildAchievementCatalog(), evaluateAchievements(), getAthleteIdByEmail(), getTeamEmails(), getTierForValue(), processCompletedTournament() (+1 more)

### Community 16 - "Module Group 16"
Cohesion: 0.25
Nodes (2): async(), saveEdit()

### Community 17 - "Module Group 17"
Cohesion: 0.39
Nodes (5): handleClose(), handleLogin(), handleRegisterAthlete(), handleRegisterClub(), reset()

### Community 18 - "Module Group 18"
Cohesion: 0.32
Nodes (3): handleGenerateTeams(), rEmail(), rName()

### Community 19 - "Module Group 19"
Cohesion: 0.29
Nodes (0): 

### Community 20 - "Module Group 20"
Cohesion: 0.29
Nodes (0): 

### Community 21 - "Module Group 21"
Cohesion: 0.33
Nodes (2): headers(), token()

### Community 22 - "Module Group 22"
Cohesion: 0.33
Nodes (7): AuthService, PublicTournament Interface, PublicTournamentService, Home Page, TournamentProfile Page, TournamentResultsPDF Page, Tournaments Page

### Community 23 - "Module Group 23"
Cohesion: 0.29
Nodes (7): ClubProfile Interface (api.ts), ClubService, PublicClub Interface, PublicClubService, ClubDashboardProfile Page, ClubProfile Page, Club Type

### Community 24 - "Module Group 24"
Cohesion: 0.53
Nodes (5): abacateRequest(), checkPixStatus(), createPixCharge(), processWebhook(), simulatePayment()

### Community 25 - "Module Group 25"
Cohesion: 0.53
Nodes (5): ToastContainer(), ToastContext, ToastItem(), ToastProvider(), useToast()

### Community 26 - "Module Group 26"
Cohesion: 0.5
Nodes (4): AuthContext, AuthProvider(), AuthService (used in AuthContext), useAuth()

### Community 27 - "Module Group 27"
Cohesion: 0.5
Nodes (0): 

### Community 28 - "Module Group 28"
Cohesion: 0.5
Nodes (0): 

### Community 29 - "Module Group 29"
Cohesion: 0.5
Nodes (0): 

### Community 30 - "Module Group 30"
Cohesion: 0.5
Nodes (0): 

### Community 31 - "Module Group 31"
Cohesion: 0.67
Nodes (0): 

### Community 32 - "Module Group 32"
Cohesion: 0.67
Nodes (0): 

### Community 33 - "Module Group 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Module Group 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Module Group 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Module Group 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Module Group 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Module Group 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Module Group 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Module Group 40"
Cohesion: 1.0
Nodes (2): PostCSS Config, Tailwind Config

### Community 41 - "Module Group 41"
Cohesion: 1.0
Nodes (2): Vite Config (Root), Vite Config (src duplicate)

### Community 42 - "Module Group 42"
Cohesion: 1.0
Nodes (2): AthleteDashboard Page, AthleteProfile Page

### Community 43 - "Module Group 43"
Cohesion: 1.0
Nodes (2): ScheduleService, Schedule Type

### Community 44 - "Module Group 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Module Group 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Module Group 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Module Group 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Module Group 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Module Group 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Module Group 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Module Group 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Module Group 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Module Group 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Module Group 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Module Group 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Module Group 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Module Group 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Module Group 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Module Group 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Module Group 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Module Group 61"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Module Group 62"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Module Group 63"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Module Group 64"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Module Group 65"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Module Group 66"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Module Group 67"
Cohesion: 1.0
Nodes (1): ToastType

### Community 68 - "Module Group 68"
Cohesion: 1.0
Nodes (1): TournamentStatus Type

### Community 69 - "Module Group 69"
Cohesion: 1.0
Nodes (1): Textarea Component

### Community 70 - "Module Group 70"
Cohesion: 1.0
Nodes (1): Select Component

### Community 71 - "Module Group 71"
Cohesion: 1.0
Nodes (1): Skeleton Component

### Community 72 - "Module Group 72"
Cohesion: 1.0
Nodes (1): BottomNav Component

### Community 73 - "Module Group 73"
Cohesion: 1.0
Nodes (1): AthleteSettings Page

### Community 74 - "Module Group 74"
Cohesion: 1.0
Nodes (1): Contact Page

### Community 75 - "Module Group 75"
Cohesion: 1.0
Nodes (1): LeagueProfile Page

### Community 76 - "Module Group 76"
Cohesion: 1.0
Nodes (1): LeaguesDashboard Page

### Community 77 - "Module Group 77"
Cohesion: 1.0
Nodes (1): PaymentPage

### Community 78 - "Module Group 78"
Cohesion: 1.0
Nodes (1): TermsPage

### Community 79 - "Module Group 79"
Cohesion: 1.0
Nodes (1): PlayoffMatch Type

### Community 80 - "Module Group 80"
Cohesion: 1.0
Nodes (1): Athlete Type

### Community 81 - "Module Group 81"
Cohesion: 1.0
Nodes (1): User Type

### Community 82 - "Module Group 82"
Cohesion: 1.0
Nodes (1): ApiResponse Type

### Community 83 - "Module Group 83"
Cohesion: 1.0
Nodes (1): DaySchedule (scheduleUtils)

### Community 84 - "Module Group 84"
Cohesion: 1.0
Nodes (1): Bubble Padel Platform

### Community 85 - "Module Group 85"
Cohesion: 1.0
Nodes (1): Snake-and-Swap Playoff Algorithm

### Community 86 - "Module Group 86"
Cohesion: 1.0
Nodes (1): ScoreModal Unified Component

## Knowledge Gaps
- **93 isolated node(s):** `Global Error Handler Middleware`, `awardLeaguePoints (Gamification)`, `PostCSS Config`, `Tailwind Config`, `Vite Config (Root)` (+88 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Module Group 33`** (2 nodes): `requireAuth()`, `auth.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 34`** (2 nodes): `errorHandler.ts`, `errorHandler()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 35`** (2 nodes): `playoffs.ts`, `getStandings()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 36`** (2 nodes): `close()`, `DashboardHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 37`** (2 nodes): `getInitials()`, `Avatar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 38`** (2 nodes): `inputCls()`, `Input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 39`** (2 nodes): `PaymentPage()`, `PaymentPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 40`** (2 nodes): `PostCSS Config`, `Tailwind Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 41`** (2 nodes): `Vite Config (Root)`, `Vite Config (src duplicate)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 42`** (2 nodes): `AthleteDashboard Page`, `AthleteProfile Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 43`** (2 nodes): `ScheduleService`, `Schedule Type`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 44`** (1 nodes): `prisma.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 45`** (1 nodes): `rateLimiter.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 46`** (1 nodes): `athlete.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 47`** (1 nodes): `auth.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 48`** (1 nodes): `club.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 49`** (1 nodes): `groups.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 50`** (1 nodes): `matches.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 51`** (1 nodes): `schedules.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 52`** (1 nodes): `teams.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 53`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 54`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 55`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 56`** (1 nodes): `vite-end.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 57`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 58`** (1 nodes): `AthleteHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 59`** (1 nodes): `Footer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 60`** (1 nodes): `Badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 61`** (1 nodes): `Button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 62`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 63`** (1 nodes): `Tabs.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 64`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 65`** (1 nodes): `TermsPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 66`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 67`** (1 nodes): `ToastType`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 68`** (1 nodes): `TournamentStatus Type`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 69`** (1 nodes): `Textarea Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 70`** (1 nodes): `Select Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 71`** (1 nodes): `Skeleton Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 72`** (1 nodes): `BottomNav Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 73`** (1 nodes): `AthleteSettings Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 74`** (1 nodes): `Contact Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 75`** (1 nodes): `LeagueProfile Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 76`** (1 nodes): `LeaguesDashboard Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 77`** (1 nodes): `PaymentPage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 78`** (1 nodes): `TermsPage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 79`** (1 nodes): `PlayoffMatch Type`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 80`** (1 nodes): `Athlete Type`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 81`** (1 nodes): `User Type`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 82`** (1 nodes): `ApiResponse Type`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 83`** (1 nodes): `DaySchedule (scheduleUtils)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 84`** (1 nodes): `Bubble Padel Platform`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 85`** (1 nodes): `Snake-and-Swap Playoff Algorithm`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Module Group 86`** (1 nodes): `ScoreModal Unified Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Shared Types` connect `API Service Layer` to `Frontend Services & Types`, `React Hooks Layer`, `Schedule Utilities`, `Module Group 18`, `Module Group 26`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `DashboardHeader Component` connect `API Service Layer` to `Module Group 21`, `API Fetch Functions`, `App Shell & AuthContext`, `Utility Functions`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `Custom Hooks` connect `API Service Layer` to `Module Group 16`, `App Shell & AuthContext`, `Utility Functions`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `Global Error Handler Middleware`, `awardLeaguePoints (Gamification)`, `PostCSS Config` to the rest of the system?**
  _93 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Service Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Backend Routes & Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Legal & Compliance Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._