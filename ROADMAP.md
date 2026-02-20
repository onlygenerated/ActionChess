# ActionChess Mobile Roadmap

*Last updated: 2026-02-20*

---

## Executive Summary

ActionChess is an auto-scrolling survival chess game with strong core mechanics and elegant simplicity. This roadmap outlines a three-phase approach to mobile launch that adds retention features while preserving the game's minimalist design.

**Core principle:** Additive, not transformative. Features should give players reasons to return without bloating the gameplay loop.

**Target platforms:** iOS and Android
**Launch timeframe:** 6-9 months (depending on team size)
**Monetization model:** Free-to-play with hybrid monetization (rewarded video + cosmetic IAP)

---

## Research-Backed Retention Principles

Based on analysis of successful minimalist mobile games (Crossy Road, Alto's Adventure, Super Hexagon, Downwell), the following retention mechanics work without adding complexity:

1. **Character unlock systems** - Cosmetic variety that doesn't change gameplay (Crossy Road's 65% retention was driven by character collection)
2. **Daily challenges** - Fixed-seed runs with leaderboards create competitive urgency (30% boost in DAU for games using daily challenges)
3. **Progression that feels fresh** - Procedural variation and unlockable goals keep each run unique (Alto's Adventure's goal system)
4. **Social sharing moments** - Low-friction ways to share achievements create organic growth
5. **Skill-based mastery** - Simple controls, brutally difficult execution (Super Hexagon's "just one more try" loop)

**Key insight:** Retention comes from giving players something to chase (unlocks, leaderboards, personal bests) while keeping the core loop pristine.

---

## Phase 1: Core Retention Features
*Timeline: 2-3 months | Priority: CRITICAL for launch*

These features are essential before mobile app store launch. They answer the question: "Why come back tomorrow?"

### 1.1 High Score Persistence & Personal Bests
**Complexity:** Low
**Why:** Foundation for all progression. Players need to see improvement over time.

- Save top 10 personal scores to localStorage
- Display personal best on death screen with "Beat your best: XX seconds" messaging
- Show score history graph (simple line chart of last 20 runs)

**Retention driver:** Gives players a clear target to beat. "I can do better than 47 seconds" is a powerful motivator.

### 1.2 Daily Challenge Mode
**Complexity:** Medium
**Why:** Creates daily appointment gaming + competitive pressure without requiring friends.

- One fixed seed per day (global, resets at midnight UTC)
- Everyone plays the same board with same enemy spawns
- Global leaderboard for that day's challenge (top 100)
- Show your rank + closest competitors (±5 ranks)
- Reward: Cosmetic unlock currency (see 1.4)

**Retention driver:** FOMO (Fear of Missing Out) + competitive comparison. Daily challenges boost DAU by 30% on average. Players return daily to compete.

**Implementation note:** Seeded RNG for enemy spawns already exists in code; just needs daily seed generation + backend for leaderboard.

### 1.3 Goal/Quest System (Passive Objectives)
**Complexity:** Medium
**Why:** Gives structure to runs without dictating strategy. Players always have "something else" to accomplish.

- 3 concurrent goals displayed on HUD (small, non-intrusive)
- Examples:
  - "Capture 5 pawns in one run"
  - "Survive 30 seconds without capturing"
  - "Reach 60 seconds"
  - "Capture a queen"
- Completing goals awards unlock currency
- New goals auto-populate after completion
- Difficulty scales with player skill (track completion rates)

**Retention driver:** Alto's Adventure style. Gives players who die early something to feel good about ("I didn't survive long, but I completed 2 goals!"). Creates micro-wins.

### 1.4 Character Unlock System (Cosmetic Only)
**Complexity:** Medium
**Why:** Crossy Road's core retention loop. Collecting characters keeps players engaged without changing gameplay.

- Unlock new player piece skins (still plays as king, just looks different)
  - Classic set: Different chess piece styles (Staunton, medieval, modern)
  - Themed sets: Neon, pixel art, minimalist, emoji
  - Rare/special: Unlocked via achievements or daily challenge milestones
- Unlock enemy skin sets (changes all enemy visuals)
- Currency earned through: Daily challenges, goal completion, play time
- Random unlock system (loot box style, but earned not purchased) or shop-based

**Retention driver:** Crossy Road saw 65% retention largely due to character variety. Players return to "see what they get next." Visual freshness without gameplay complexity.

**Design note:** Keep unlocks purely cosmetic. Changing piece movement rules would violate the "stay simple" mandate.

### 1.5 Achievement System
**Complexity:** Low
**Why:** Long-tail goals for mastery players.

- 20-30 achievements tied to skill milestones
  - Time-based: Survive 60s, 90s, 120s
  - Capture-based: Capture 100 pieces total, capture a queen
  - Streak-based: 5 runs in one day, 7-day play streak
  - Skill-based: Win without capturing, survive 30s in queen-tier difficulty
- Displayed in dedicated achievements screen
- Award unlock currency or exclusive skins

**Retention driver:** Gives hardcore players long-term mastery goals. Completionists will chase 100%.

### 1.6 Mobile Touch Controls
**Complexity:** Medium-High
**Why:** Can't ship on mobile without this.

- Tap-to-move: Tap any valid move square to move there
- Tap-and-hold to preview move (helpful for new players)
- Swipe gestures as alternative (optional, test with users)
- Responsive touch zones (minimum 44x44pt touch targets)
- Visual feedback for touches (ripple effect, highlight)

**Retention driver:** Not a retention feature per se, but poor touch controls = instant churn. Must be smooth and responsive.

---

## Phase 2: Mobile Polish
*Timeline: 2-3 months | Priority: HIGH for successful launch*

These features are mobile-specific and required for app store approval + competitive positioning.

### 2.1 App Store Submission Preparation
**Complexity:** Medium
**Why:** Required for launch. Non-negotiable.

**Technical requirements:**
- Build with iOS 26 SDK / Android API level 34+ (2026 requirements)
- Apple Developer account ($99/year) + Google Play account ($25 one-time)
- Privacy policy page (required even for games with no data collection)
- Age rating compliance (likely PEGI 3 / ESRB E)
- Testing: 20+ testers for 2 weeks minimum (Google Play requirement for new devs)

**Store metadata:**
- App name: "ActionChess" or "Action Chess: Survival" (test for ASO)
- Subtitle: "Auto-Scrolling Chess Survival" (50 chars max)
- Keywords: chess, survival, endless, runner, arcade, skill
- Screenshots: 6-8 screenshots showing gameplay, death screen, character unlocks
- App preview video: 15-30 second gameplay clip
- Icon: Simple, recognizable at small sizes (512x512 source)

**Soft launch strategy:**
- Launch in 1-2 smaller markets first (e.g., Canada, Philippines)
- Monitor retention metrics: D1 target 45%+, D7 target 20%+, D30 target 10%+
- Iterate on monetization and difficulty before global launch

### 2.2 Sound Design & Music
**Complexity:** Medium
**Why:** Mobile games need audio feedback. Silence feels unfinished.

- Sound effects:
  - Move sound (subtle whoosh)
  - Capture sound (satisfying thunk)
  - Death sound (dramatic but not harsh)
  - UI sounds (button taps, achievement unlocks)
- Background music (optional, but recommended):
  - Looping ambient track, tension builds subtly over time
  - Mutable (many players play on silent)
- Audio mixing: SFX at 70%, music at 40% by default
- Settings: Master volume, SFX volume, music volume toggles

**Retention driver:** Audio creates tactile satisfaction. Crossy Road's "hop" sound is iconic. Good audio = more satisfying = more replays.

### 2.3 Visual Polish Pass
**Complexity:** Medium
**Why:** Visual clarity and appeal matter on mobile. Unicode chess pieces won't cut it for app store presentation.

- Replace Unicode symbols with crisp SVG or sprite-based pieces
- Particle effects:
  - Capture burst (simple, satisfying)
  - Death explosion (dramatic but quick)
  - Goal completion sparkle
- Screen shake on capture/death (subtle, toggleable)
- Color themes (unlockable): Classic, Dark mode, Neon, Pastel
- Smooth transitions between screens (menu → game → death)

**Retention driver:** Visual polish signals quality. Players are more likely to stick with a game that "feels premium."

### 2.4 Onboarding & Tutorial
**Complexity:** Medium
**Why:** Alto's Adventure succeeded partly due to smooth 2-minute onboarding. First impressions matter.

- 30-second interactive tutorial:
  - "Tap to move" (force one move)
  - "Avoid enemies" (spawn one pawn)
  - "Or capture them!" (force one capture)
  - "Survive as long as you can" (game starts)
- Skippable after first play
- Optional "Tips" button on menu screen
- First run hints (toast notifications, dismissible):
  - "Don't scroll off the top!"
  - "New piece types unlock as you survive longer"

**Retention driver:** Clear onboarding reduces D1 churn. Players who understand the game stick around.

### 2.5 Monetization Implementation
**Complexity:** Medium-High
**Why:** Need revenue to sustain development. Hybrid model balances user experience + income.

**Model: Hybrid (Rewarded Video + Cosmetic IAP)**

**Rewarded video ads:**
- Offer after death: "Continue run (1 revive per session)" or "2x unlock currency for this run"
- Frequency: Max 1 ad per run (non-intrusive)
- Provider: AdMob, Unity Ads, or IronSource

**In-app purchases:**
- Remove ads: $2.99 (one-time purchase)
- Currency packs: $0.99 (small), $2.99 (medium), $4.99 (large)
- Exclusive character packs: $1.99 each (premium skins not available via gameplay)
- "Supporter pack": $4.99 (removes ads + exclusive skin + currency)

**Best practices:**
- Start with fewer ads, ramp up after day 3 (progressive monetization)
- 79% of players tolerate ads; 86% of devs see no IAP drop when adding ads
- Offer value, not pay-to-win (cosmetic-only IAP preserves fairness)

**Retention driver:** Well-timed rewarded ads extend engagement ("just one more run to unlock this skin"). Fair monetization builds trust.

### 2.6 Analytics & Crash Reporting
**Complexity:** Low
**Why:** Can't optimize what you can't measure.

- Integrate Firebase Analytics or GameAnalytics
- Track key events:
  - Session start/end
  - Run start, run end (with score, time survived)
  - Deaths by cause (scrolled off, captured by pawn/knight/etc.)
  - Goal completions, achievements unlocked
  - Daily challenge participation
  - Ad views, IAP purchases
- Crash reporting: Firebase Crashlytics or Sentry
- Monitor retention cohorts weekly

**Retention driver:** Data reveals friction points. Fix what's broken, double down on what works.

---

## Phase 3: Post-Launch Growth
*Timeline: Ongoing | Priority: MEDIUM (after successful launch)*

These features extend the game's lifespan and build community, but aren't required for launch.

### 3.1 Friend Leaderboards
**Complexity:** Medium
**Why:** Social competition is more engaging than global leaderboards for most players.

- Integrate Game Center (iOS) / Google Play Games (Android)
- Friend leaderboards: See friends' best scores
- Challenge friends: "Beat [Friend]'s 67-second run!"
- Ghost racing (optional): See friend's path overlaid on your run

**Retention driver:** Competing with friends is more personal than global leaderboards. "I need to beat Sarah's score" is powerful motivation.

### 3.2 Seasonal Events & Limited Unlocks
**Complexity:** Medium
**Why:** FOMO + content freshness without permanent bloat.

- Monthly themes: Halloween (spooky pieces), Winter (snow theme), etc.
- Limited-time character skins (available for 1-2 weeks)
- Event-specific daily challenges with boosted rewards
- Seasonal leaderboards (separate from all-time)

**Retention driver:** Events create urgency. Players return during events to grab exclusive content.

### 3.3 Alternate Game Modes (Experimental)
**Complexity:** High
**Why:** Variety for veterans without changing core mode. Test carefully to avoid complexity creep.

**Potential modes:**
- Blitz Mode: Faster scroll speed, shorter runs (30s average), leaderboard separate
- Zen Mode: No enemies spawn, just practice movement and scrolling (relaxing, no stakes)
- Boss Rush: Face waves of queens only
- Random Piece Mode: You control a random piece each run (queen, rook, knight, etc.)

**Design caution:** Only add modes that are truly distinct and requested by community. Don't dilute the core experience.

**Retention driver:** Modes appeal to different moods. "I want a quick game" → Blitz. "I want to relax" → Zen. Extends playtime.

### 3.4 Community & Sharing Features
**Complexity:** Low-Medium
**Why:** Organic growth through player-generated buzz.

- Share score to social (Twitter, Instagram, Facebook):
  - Auto-generate shareable image (score + character used)
  - Pre-filled text: "I survived XX seconds in ActionChess! Can you beat it?"
- Replay sharing (advanced): Save last run, let others watch
- Community challenges: Developer-created weekly challenges with unique modifiers

**Retention driver:** Sharing creates accountability ("I posted my score, now I need to beat it") + brings in new players.

### 3.5 Accessibility Features
**Complexity:** Medium
**Why:** Inclusive design expands audience. Also increasingly required for app store featuring.

- Colorblind modes (highlight valid moves with shapes, not just color)
- Reduced motion mode (disable screen shake, particle effects)
- Adjustable scroll speed (accessibility option, not difficulty setting)
- VoiceOver / TalkBack support (screen reader compatibility)
- One-handed mode option (move UI elements)

**Retention driver:** Accessible games retain more players. Shows you care about all users.

### 3.6 Advanced Progression Systems (Power Creep Risk - EVALUATE CAREFULLY)
**Complexity:** High
**Why:** Gives long-term players persistent upgrades, but risks violating "stay simple" principle.

**Potential systems (ADD ONLY IF RETENTION DROPS):**
- Meta-progression: Permanent upgrades bought with currency
  - Start with +1 second of safety before first enemy spawns
  - Slightly slower initial scroll speed
  - Early piece unlocks (start with pawns + knights already unlocked)
- Prestige system: Reset unlocks for exclusive cosmetics + title

**Design warning:** Meta-progression can make the game feel "grindy" and violate the pure skill-based appeal. Only add if data shows retention issues that cosmetics/leaderboards can't solve.

**Alternative:** Keep progression purely cosmetic. ActionChess's appeal is skill-based mastery, like Super Hexagon. Don't dilute that.

---

## Implementation Priorities

### Must-Have for Launch (Phase 1 + 2.1-2.4)
1. High score persistence
2. Daily challenge + leaderboard
3. Goal system
4. Character unlocks (at least 10-15 skins)
5. Touch controls
6. Sound design
7. Visual polish (no Unicode pieces)
8. Onboarding tutorial
9. App store submission prep

### Nice-to-Have for Launch (Phase 2.5-2.6 + Phase 3.1)
10. Monetization (can soft launch without, but need for sustainability)
11. Analytics
12. Friend leaderboards

### Post-Launch (Phase 3.2-3.6)
13. Seasonal events
14. Alternate modes
15. Community features
16. Accessibility
17. Advanced progression (ONLY IF NEEDED)

---

## Success Metrics

### Retention Targets (Industry Benchmarks)
- **D1 retention:** 45%+ (good), 27% (average)
- **D7 retention:** 20%+ (good), 8% (average)
- **D30 retention:** 10%+ (good), 3% (average)

### Engagement Targets
- **Session length:** 3-5 minutes average (endless runners typically short sessions)
- **Sessions per day:** 3-5 (daily challenge + "just one more")
- **Daily challenge participation:** 40%+ of DAU

### Monetization Targets (Post-Launch)
- **Ad revenue:** $0.02-0.05 per DAU (rewarded video)
- **IAP conversion:** 2-5% of players make a purchase
- **ARPDAU (Average Revenue Per Daily Active User):** $0.05-0.15

---

## Risk Assessment

### High Risk
- **Difficulty tuning:** Too easy = boring, too hard = frustrating. Requires extensive playtesting across skill levels.
- **Monetization balance:** Too aggressive = churn, too light = unsustainable. Test carefully in soft launch.

### Medium Risk
- **Daily challenge backend:** Requires server infrastructure for leaderboards. Consider using existing platforms (Game Center, Google Play Games) vs. custom backend.
- **Touch control feel:** Critical for mobile. Requires iteration to match mouse precision.

### Low Risk
- **Cosmetic unlocks:** Low implementation risk, high retention value. Worst case: players ignore them.
- **Sound design:** Can iterate post-launch. Not a launch blocker.

---

## Competitive Positioning

**Similar games:** Crossy Road (endless + unlocks), Super Hexagon (skill-based survival), Downwell (endless descent), Temple Run (endless runner)

**ActionChess differentiation:**
- Chess piece movement creates unique tactical depth (no other endless runner uses chess rules)
- Auto-scrolling + chess = fresh genre hybrid
- Minimalist aesthetic (no visual clutter, pure focus)
- Skill ceiling is very high (mastery takes time, like Super Hexagon)

**Target audience:**
- Chess players looking for casual experience
- Endless runner fans wanting more strategic depth
- Skill-based arcade game fans (Super Hexagon, Downwell crowd)
- Mobile gamers who value "easy to learn, hard to master"

---

## Development Resources Needed

### Roles
- **Developer:** Core implementation (1 person can handle this, 3-6 months full-time)
- **Artist/Designer:** Character skins, visual polish, UI/UX (contract work, ~40-80 hours)
- **Sound designer:** SFX + music (contract work, ~20-40 hours)
- **QA/Playtester:** 20+ testers for app store requirements + balance feedback

### Tools/Services
- **Development:** Existing web codebase can port to mobile via Cordova/Capacitor or rewrite in React Native / Flutter
- **Backend:** Firebase (free tier sufficient for MVP), Game Center + Google Play Games for leaderboards
- **Analytics:** Firebase Analytics (free)
- **Ads:** AdMob or Unity Ads
- **Testing:** TestFlight (iOS), Google Play Internal Testing (Android)

---

## Timeline Estimate

**Realistic timeline for solo/small team:**

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1 (Core retention) | 2-3 months | 3 months |
| Phase 2 (Mobile polish) | 2-3 months | 6 months |
| Soft launch + iteration | 1-2 months | 8 months |
| Global launch | — | 8 months |
| Phase 3 (Post-launch) | Ongoing | — |

**Aggressive timeline (with team):** 4-5 months to launch
**Conservative timeline (solo dev, part-time):** 9-12 months to launch

---

## Key Takeaways

1. **Preserve simplicity:** Every feature should answer "Does this add depth or just complexity?" Depth = good. Complexity = bad.

2. **Retention through collection, not grind:** Character unlocks and daily challenges create habit loops without changing core gameplay.

3. **Mobile-first polish matters:** Touch controls, onboarding, and visual clarity are non-negotiable for success on app stores.

4. **Monetization should feel fair:** Rewarded video + cosmetic IAP respects players while sustaining development.

5. **Launch lean, iterate fast:** Ship with Phase 1 + 2, gather data, then decide which Phase 3 features to build based on player behavior.

6. **Skill-based mastery is the core appeal:** Don't add meta-progression that undermines the "pure skill" feel. ActionChess should be closer to Super Hexagon than Crossy Road in difficulty, but with Crossy Road's unlock loop.

---

## Sources

This roadmap was informed by research into successful minimalist mobile games and 2026 industry best practices:

**Mobile Game Retention:**
- [DAU and Retention Analysis for Mobile Games 2026 - Playio Blog](https://blog.playio.co/dau-retention-analysis-mobile-games-2026)
- [Why Retention is Your Most Critical Mobile Game KPI - Playio Blog](https://blog.playio.co/mobile-game-kpi-performance-goals-retention-strategy)
- [Mobile Game Retention Rates (2026) - Business of Apps](https://www.businessofapps.com/data/mobile-game-retention-rates/)
- [17 Proven Player Retention Strategies - Game Design Skills](https://gamedesignskills.com/game-design/player-retention/)

**Case Studies:**
- [Why Crossy Road focused on sharing and retention - PocketGamer.biz](https://www.pocketgamer.biz/crossy-road-sharing-retention/)
- [Alto's Adventure: Case Study - Game Developer](https://www.gamedeveloper.com/design/alto-s-adventure-case-study)

**App Store Requirements:**
- [App Launch Checklist 2026 - AppLaunchFlow](https://www.applaunchflow.com/blog/app-launch-checklist-2026)
- [App Store Requirements: iOS & Android Submission Guide 2026 - Natively](https://natively.dev/articles/app-store-requirements)

**Monetization:**
- [Top Mobile Game Monetization Strategies for 2026 - Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/mobile-game-monetization)
- [How to Monetize a Game: Proven Strategies for Success - Juego Studio](https://www.juegostudio.com/blog/game-monetization)

**Daily Challenges & Leaderboards:**
- [Love Battling for High Scores? 10 Games You Should Be Playing - How-To Geek](https://www.howtogeek.com/love-battling-for-high-scores-games-you-should-be-playing/)
- [Roguelike - Wikipedia](https://en.wikipedia.org/wiki/Roguelike)

**Game Progression Systems:**
- [Game Progression and Progression Systems - Game Design Skills](https://gamedesignskills.com/game-design/game-progression/)
- [The Psychology of Hot Streak Game Design - UX Magazine](https://uxmag.medium.com/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame-3dde153f239c)

---

*End of roadmap. Questions or feedback? Discuss with Phil.*
