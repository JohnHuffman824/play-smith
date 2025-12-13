# Unified Concept Search

**Status:** ✅ Implemented with Frecency Ranking (December 2024)

The unified search system provides fast, intelligent access to formations, concepts, and concept groups with results ranked by frequency of use and recency.

## Overview

The unified search bar sits at the top of the play editor, providing one-click access to formations, route concepts, and concept groups without opening dialogs or navigating menus.

## Search Features

### Unified Results

**Single Search Bar for All Concept Types:**
- Formations ("Trips Right", "I-Formation")
- Route concepts ("Mesh", "Flood")
- Full play concepts ("Power O", "Four Verticals")
- Modifier concepts ("Jet Motion", "Shift Left")
- Concept groups ("Red Zone Plays", "Third Down")

**No Category Filtering Required:**
- Type partial name, see all matching concepts
- Results include type indicator (Formation, Concept, Group)
- Example: Search "mesh" returns "Mesh" concept and "Mesh Concept Group"

### Frecency Ranking

**Definition:** Frecency = Frequency + Recency

**Ranking Algorithm:**
1. **Frequency:** How often the concept has been used
2. **Recency:** When it was last used
3. **Combined Score:** Concepts used frequently and recently rank highest

**Benefits:**
- Most relevant concepts appear first
- Adapts to coaching workflow (game week concepts rise to top)
- Less scrolling to find frequently used concepts

**Example Ranking:**
```
Search: "trips"
Results:
1. Trips Right (used 50 times, last used today) - Frecency: 95
2. Trips Left (used 40 times, last used yesterday) - Frecency: 88
3. Trips Stack (used 10 times, last used 2 weeks ago) - Frecency: 45
```

### Search Algorithm

**Matching:**
- Partial string match (case-insensitive)
- Matches anywhere in concept name
- Example: "mesh" matches "Mesh", "Reduced Mesh", "Tight Mesh"

**Scoring:**
```typescript
function calculateFrecency(concept) {
  const frequency = concept.useCount;
  const recency = daysSinceLastUsed(concept);

  // Decay factor: older uses count less
  const recencyScore = Math.exp(-recency / 30); // 30-day half-life

  return frequency * recencyScore;
}
```

**Sorting:**
1. Calculate frecency score for all matches
2. Sort by frecency (high to low)
3. Return top 10 results (or all if < 10)

## Search Interaction

### Search Bar

**Location:** Top of play editor, above input fields

**Appearance:**
- Full-width search input
- Placeholder: "Search formations, concepts, and groups..."
- Search icon (magnifying glass) on left
- Clear button (X) on right (when text entered)

**Behavior:**
- Focus: Expands slightly, results dropdown appears below
- Type: Results update in real-time (debounced 150ms)
- Blur: Results hide after selection or click outside

### Results Dropdown

**Display:**
- Max 10 results shown (scroll if more)
- Each result shows:
  - Concept name (bold)
  - Type badge (Formation, Concept, Group)
  - Preview thumbnail (small)
  - Use count and last used date (optional, future)

**Navigation:**
- Arrow keys: Navigate results
- Enter: Select highlighted result
- Escape: Close dropdown
- Click result: Select

### Selection

**On Select:**
1. Result selected (click or Enter)
2. Draggable chip appears above canvas
3. Search bar clears
4. Results dropdown hides
5. Chip auto-applies concept to canvas

**Chip Appearance:**
- Rounded rectangle
- Concept name
- Type icon (formation/concept/group)
- Remove button (X)

## Draggable Chips

**Status:** ✅ Implemented (December 2024)

### Chip Behavior

**Placement:**
- Chips appear in row above canvas
- Fill left to right
- Multiple chips can exist simultaneously

**Drag and Drop:**
- Click and hold chip
- Drag to reorder
- Drop in new position
- Chips reflow automatically

**Application Order:**
- Chips applied left to right
- Example: [Trips Right] [Mesh] = Trips formation, then Mesh routes
- Reorder to change application order
- Example: [Mesh] [Trips Right] may have different result (future: validate compatible orders)

**Remove:**
- Click X on chip
- Chip disappears
- Applied concept remains on canvas
- To remove concept from canvas, undo or delete elements

### Auto-Apply

**Automatic Application:**
- When chip added, concept auto-applies to canvas
- No "Apply" button needed
- Immediate visual feedback

**Application Behavior:**

**Formation Chips:**
- Players placed at current hash position
- Skill players added to default linemen
- Formation relative to center lineman

**Route Concept Chips:**
- Routes added for roles defined in concept
- Routes linked to players automatically
- If no matching players, warning shown

**Modifier Chips:**
- Modifies existing formation/routes
- Example: "Jet Motion" adds motion path to receiver
- Checks for formation-specific overrides (see [Modifiers](./modifiers.md))

**Group Chips:**
- Expands to show all concepts in group
- Individual concepts available for application
- Quick filter to group's concepts

### Multiple Chips

**Scenario:** Apply formation, then route concept, then modifier

**Workflow:**
1. Search "Trips Right", select
2. Chip appears, formation applied
3. Search "Mesh", select
4. Second chip appears, mesh routes added to trips formation
5. Search "Jet Motion", select
6. Third chip appears, motion path added to mesh routes

**Order Matters:**
- Formation first, then routes, then modifiers
- Incorrect order may produce unexpected results
- Future: Validate and auto-reorder chips

## API Endpoint

### Unified Search

**Endpoint:** `GET /api/search`

**Query Parameters:**
- `q`: Search query string
- `teamId`: Team ID (for team-specific concepts)
- `types`: Optional filter (formation, concept, group)

**Request Example:**
```
GET /api/search?q=mesh&teamId=team-uuid
```

**Response:**
```json
{
  "results": [
    {
      "id": "concept-uuid-1",
      "name": "Mesh",
      "type": "concept",
      "subtype": "route",
      "thumbnail": "data:image/png;base64,...",
      "useCount": 45,
      "lastUsed": "2024-12-15T14:30:00Z",
      "frecency": 92.3
    },
    {
      "id": "concept-uuid-2",
      "name": "Reduced Mesh",
      "type": "concept",
      "subtype": "route",
      "thumbnail": "data:image/png;base64,...",
      "useCount": 12,
      "lastUsed": "2024-12-10T10:00:00Z",
      "frecency": 58.7
    },
    {
      "id": "group-uuid-1",
      "name": "Mesh Concept Group",
      "type": "group",
      "conceptCount": 5,
      "lastUsed": "2024-12-14T16:00:00Z",
      "frecency": 75.2
    }
  ]
}
```

**Sorting:** Results pre-sorted by frecency (backend calculation)

### Tracking Usage

**Endpoint:** `POST /api/concepts/:id/track-usage`

**Behavior:**
- Called when concept applied to play
- Increments `useCount`
- Updates `lastUsed` timestamp
- Affects future frecency rankings

**Automatic Tracking:**
- Triggered on chip application
- Triggered on Add Component tool application
- Not triggered on preview (future: track previews separately)

## Search Performance

### Optimization Strategies

**Debouncing:**
- 150ms delay after last keystroke before search
- Reduces API calls during typing
- Smooth UX without lag

**Caching:**
- Frecency scores cached for 1 hour
- Refreshed when new concepts used
- Reduces database queries

**Indexing:**
- Database full-text search index on concept names
- GIN index for fast LIKE queries
- Trigram similarity for fuzzy matching (future)

### Response Time

**Target:** < 100ms for search results

**Optimization:**
- Search limited to team's concepts (not global)
- Results limited to top 10 (or configurable limit)
- Thumbnail pre-generated (not generated on-the-fly)

## Empty States

### No Results

**Display:**
```
No concepts found for "xyz"

- Check spelling
- Try broader search terms
- Create new concept from current play
```

**Create Button:**
- Quick access to create concept
- Pre-fills search term as concept name

### No Concepts in Team

**Display:**
```
Your team has no concepts yet

- Save your first concept from a play
- Import concepts from another team (future)
- Browse community concepts (future)
```

**Help Link:**
- Documentation on creating concepts
- Tutorial video (future)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + K | Focus search bar |
| Escape | Clear search and close dropdown |
| Arrow Up/Down | Navigate results |
| Enter | Select highlighted result |
| Tab | Close search (future: navigate to next input) |

## Use Cases

### Quick Formation Change

**Scenario:** Coach wants to try play from different formation

**Workflow:**
1. Cmd+K to focus search
2. Type "doubles"
3. Arrow down to "Doubles Left"
4. Enter to select
5. Formation applied instantly

**Time:** 3-5 seconds

### Concept Exploration

**Scenario:** Coach remembers partial concept name

**Workflow:**
1. Type "flood" in search
2. See all flood variants
3. Hover for thumbnail preview (future)
4. Select desired variant
5. Concept applied

### Game Plan Development

**Scenario:** Building Week 1 game plan

**Workflow:**
1. Search "week 1" (concept group)
2. Select "Week 1 Game Plan" group
3. All Week 1 concepts prioritized in future searches
4. Frecency adapts to weekly focus

## Future Enhancements

### Fuzzy Search
- Typo tolerance ("mseh" → "Mesh")
- Phonetic matching
- Abbreviation expansion ("4V" → "Four Verticals")

### Advanced Filters
- Filter by personnel (show only 11 personnel concepts)
- Filter by down-and-distance
- Filter by tags (pass, run, RPO)

### Search History
- Recently searched concepts
- Quick re-search
- Clear history

### Search Suggestions
- "Did you mean..." for typos
- Related concepts ("Mesh" → "Also consider: Shallow Cross")
- Popular searches this week

### Visual Search (Future)
- Draw rough route shape
- AI matches similar concepts
- Example: Draw crossing routes → suggests "Mesh", "China", "Switch"

---

## Technical Implementation

### Frontend Components

**UnifiedSearchBar:** `src/components/search/UnifiedSearchBar.tsx`
- Search input
- Results dropdown
- Keyboard navigation

**SearchResultItem:** `src/components/search/SearchResultItem.tsx`
- Result display with type badge
- Thumbnail preview
- Click to select

**ConceptChip:** `src/components/search/ConceptChip.tsx`
- Draggable chip component
- Remove button
- Auto-apply trigger

### Backend Services

**SearchService:** `src/services/SearchService.ts`
- Unified search logic
- Frecency calculation
- Result ranking

**ConceptUsageTracker:** `src/services/ConceptUsageTracker.ts`
- Track concept applications
- Update use counts and timestamps
- Cache invalidation

### Database Optimization

**Indexes:**
```sql
CREATE INDEX idx_concepts_name_trgm ON concepts USING gin (name gin_trgm_ops);
CREATE INDEX idx_concepts_team_id ON concepts(team_id);
CREATE INDEX idx_concepts_use_count ON concepts(use_count);
CREATE INDEX idx_concepts_last_used ON concepts(last_used);
```

**Materialized View (Future):**
- Pre-calculate frecency scores
- Refresh hourly or on-demand
- Faster search queries

---

## See Also

- [Concepts Overview](./overview.md) - What concepts are and how they work
- [Modifiers](./modifiers.md) - Formation-specific modifier overrides
- [Play Editor Overview](../play-editor/overview.md) - Search bar location in editor
- [Team Libraries](../playbook/team-libraries.md) - Formation and route templates
