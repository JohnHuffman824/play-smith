# Learn Feature Design

**Goal:** Enable coaches to create and assign quizzes/study materials to players, with LLM-powered question generation from play data.

**Status:** Design Phase (not yet implemented)

---

## Overview

The Learn feature combines two complementary modes:
1. **Quiz Mode** - Assessment tool for coaches to verify player knowledge
2. **Study Mode** - Self-paced learning for players to master plays at home

LLMs generate questions automatically from existing play data, minimizing coach setup time while maintaining quality through coach review before publishing.

---

## User Roles & Permissions

Play Smith uses a unified UI with permission-based feature access:

| Role | Capabilities |
|------|-------------|
| **Team Admin** | Full control: manage users, create coaches, configure team settings |
| **Coach** | Edit playbooks/plays, create assignments, view player progress |
| **Player** | View playbooks (read-only), complete assignments, self-study |

### Player Onboarding
- Coaches generate **invite links** for players
- Players click link → self-register → automatically join team
- Players see assignments in left column of Playbook Manager page

---

## Quiz Mode (Assessment)

### Question Types (LLM-Generated)

1. **Multiple Choice**
   - "What's the X receiver's route on 'Mesh Left'?"
   - 4 options, one correct answer
   - LLM generates plausible distractors from other plays

2. **Assignment Matching**
   - Match player positions to their responsibilities
   - Drag-and-drop or line-drawing interface
   - Tests understanding of all 11 assignments

3. **Diagram Labeling**
   - Show play diagram with blanked-out routes/positions
   - Player clicks to identify their spot or draws their route
   - Visual recognition of formations

4. **Free Response**
   - Player types answer in their own words
   - LLM grades response against expected answer
   - Allows partial credit and feedback

5. **Scenario-Based**
   - "Defense shows Cover 2, what's your hot read?"
   - Tests game-situation decision making
   - LLM generates realistic defensive looks

### Quiz Creation Flow

```
Coach selects plays/sections/tags
    ↓
LLM auto-generates question pool
    ↓
Coach reviews & edits questions (optional)
    ↓
Coach sets parameters (# questions, time limit, due date)
    ↓
Coach assigns to players (all, by position, individual)
    ↓
Players receive email notification
    ↓
Players complete quiz
    ↓
Coach views results in dashboard
```

### LLM Integration Details

**Input to LLM:**
- Play name, formation, personnel
- Player positions and assignments (routes, blocks, reads)
- Tags (situation context: red zone, 3rd down, etc.)
- Team terminology settings

**Prompt Strategy:**
- System prompt establishes football coaching context
- Include team's position naming system (X, Y, Z, etc.)
- Request specific question type with format constraints
- Ask for explanation/coaching point with each answer

**Example LLM Prompt:**
```
Generate a multiple-choice question for the play "Mesh Left" from Trips formation.
Focus on the Z receiver's assignment.
Use terminology: X=split end, Y=tight end, Z=flanker, F=fullback, T=tailback
Include 4 options with one correct answer.
Provide a brief coaching explanation for the correct answer.
```

---

## Study Mode (Self-Paced Learning)

### Study Formats

1. **Flashcard Style**
   - Front: Play diagram (formation visible)
   - Back: Full assignment details for player's position
   - Swipe through plays in a section

2. **Progressive Reveal**
   - Level 1: Formation only (identify the set)
   - Level 2: Add routes (trace the patterns)
   - Level 3: Add reads (understand progressions)
   - Level 4: Coaching points (technique details)

3. **Video/Animation Integration** (Future)
   - Attach film clips to specific plays
   - Animated play execution showing timing
   - Sync with practice film from Hudl

### Position-Specific Views
- Players only see their assignment highlighted
- Reduces cognitive load
- Option to view full play for context

---

## Assignment System

### What Coaches Can Assign

| Type | Description | Example |
|------|-------------|---------|
| Individual plays | Specific plays to study | "Study plays #12, #15, #23" |
| Sections | All plays in a playbook section | "Study all Goal Line plays" |
| Tags | All plays with specific tags | "Study all Red Zone plays" |
| Custom quizzes | Curated question sets | "Week 3 Install Quiz" |
| Position-specific | Filtered to player's role | "WR assignments for Trips formation" |

### Assignment Properties
- **Due date** - When assignment should be completed
- **Required vs Optional** - Mandatory or extra credit
- **Attempts allowed** - Unlimited study, limited quiz attempts
- **Passing score** - Minimum % to mark complete (quizzes)

---

## Progress Tracking

### Phase 1: Simple Completion (MVP)
- Who completed assignments
- Who hasn't started
- Overall scores (% correct)
- Completion by due date

### Phase 2: Detailed Analytics (Future)
- Per-question performance analysis
- Time spent per play/question
- Retry attempts and improvement
- Struggling areas by concept/play type
- Position group comparisons

### Coach Dashboard View
```
┌─────────────────────────────────────────────┐
│ Red Zone Quiz - Due Friday                  │
├─────────────────────────────────────────────┤
│ Completed: 18/22 players (82%)              │
│ Average Score: 78%                          │
│                                             │
│ ⚠ Not Started:                              │
│   - Marcus Johnson (WR)                     │
│   - Tyler Smith (OL)                        │
│   - Devon Williams (RB)                     │
│   - Jake Thompson (TE)                      │
│                                             │
│ 📊 Struggling Questions:                    │
│   - Q3: "Z route on Mesh" - 45% correct     │
│   - Q7: "Hot read vs Cover 2" - 52% correct │
└─────────────────────────────────────────────┘
```

---

## Notifications

### Email Notifications (Phase 1)
- New assignment notification
- Due date reminder (24 hours before)
- Quiz results available

### Future: Push Notifications (Mobile App)
- Real-time assignment alerts
- Practice reminders
- Streak maintenance nudges

---

## UI Integration

### Player View (Playbook Manager - Left Column)

```
┌──────────────────┐
│ 📚 My Playbooks  │
│   > Offense 2025 │
│   > Special Teams│
├──────────────────┤
│ 📝 Assignments   │
│                  │
│ ⏰ Due Soon      │
│ • Red Zone Quiz  │
│   Due: Friday    │
│   [Start Quiz]   │
│                  │
│ 📖 Study         │
│ • Week 3 Install │
│   12 plays       │
│   [Continue]     │
│                  │
│ ✅ Completed     │
│ • Formation Quiz │
│   Score: 92%     │
└──────────────────┘
```

### Coach View (Additional Features)
- "Create Assignment" button in playbook/section headers
- "Generate Quiz" option in play selection menu
- Progress dashboard accessible from main nav
- Bulk assign to position groups

---

## Technical Considerations

### LLM Provider Options
- OpenAI GPT-4 (best quality, higher cost)
- Claude API (good balance)
- Local/smaller models (cost optimization for simple questions)

### Question Storage
- Store generated questions in database
- Link to source play data
- Track which questions each player has seen
- Enable question reuse across quizzes

### Grading Free Response
- LLM compares player answer to expected answer
- Semantic similarity scoring (not exact match)
- Coach can override LLM grades
- Build training data from coach overrides

### Offline Considerations (Future Mobile App)
- Cache assigned plays for offline study
- Queue quiz submissions when offline
- Sync when connection restored

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Player invite system (links, self-registration)
- [ ] Player role and permissions
- [ ] Assignment data model
- [ ] Basic assignment UI in left column

### Phase 2: Study Mode
- [ ] Flashcard-style play viewer
- [ ] Position-specific filtering
- [ ] Study progress tracking
- [ ] Email notifications for assignments

### Phase 3: Quiz Mode (LLM Integration)
- [ ] LLM question generation pipeline
- [ ] Multiple choice questions
- [ ] Quiz creation/assignment flow
- [ ] Basic scoring and results

### Phase 4: Advanced Questions
- [ ] Assignment matching UI
- [ ] Diagram labeling interaction
- [ ] Free response with LLM grading
- [ ] Scenario-based questions

### Phase 5: Analytics
- [ ] Detailed progress dashboard
- [ ] Per-question analytics
- [ ] Struggling area identification
- [ ] Position group reports

### Phase 6: Enhanced Features
- [ ] Progressive reveal study mode
- [ ] Video/animation integration
- [ ] Gamification (streaks, badges)
- [ ] Mobile app with push notifications

---

## Open Questions

1. **Question bank sharing** - Should teams be able to share/sell question templates?
2. **AI coaching suggestions** - Should LLM suggest which players need extra help?
3. **Practice integration** - Connect quiz performance to practice rep allocation?
4. **Parent access** - Should parents see player progress for youth leagues?

---

## References

- GoRout article on playbook implementation and teaching methods
- Existing Play Smith design document (Export & Integration section)
- Team terminology and position naming system settings
