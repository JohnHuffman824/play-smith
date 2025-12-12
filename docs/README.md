# PlaySmith Documentation

**Welcome!** This documentation is organized into modular, AI-agent-friendly sections that make it easy to find exactly what you need without loading unnecessary context.

---

## 🎯 Quick Navigation by Task

| If you need to... | Load these files |
|------------------|-----------------|
| Add/modify UI components | `components/README.md` + specific category file |
| Work on play editor features | `features/play-editor/*.md` |
| Modify playbook management | `features/playbook/*.md` |
| Update database schema | `database/README.md` + specific table files |
| Deploy or configure infrastructure | `deployment/*.md` |
| Understand system architecture | `guides/architecture.md` |
| Style UI elements | `styling/style-guide.md` |

---

## 📁 Directory Structure

```
docs/
├── README.md                    # This file - start here
│
├── components/                  # UI Component Library (shadcn/ui + custom)
│   ├── README.md                # Component quick reference table
│   ├── foundational/            # Buttons, inputs, form controls
│   ├── layout/                  # Cards, containers, spacing
│   ├── overlay/                 # Dialogs, sheets, popovers, menus
│   ├── navigation/              # Tabs, sidebars, pagination
│   ├── data-display/            # Tables, badges, charts
│   ├── forms/                   # Form system & validation
│   └── utilities/               # Accordion, notifications
│
├── features/                    # Application Features
│   ├── README.md                # Feature overview
│   ├── whiteboard/              # Field canvas, zoom/pan
│   ├── play-editor/             # Tools, drawing, players
│   ├── playbook/                # Playbook management, sharing
│   ├── concepts/                # Formations, concepts, search
│   ├── animation/               # Play animation system
│   ├── presentations/           # Presentation slideshows
│   └── auth/                    # Authentication, teams
│
├── database/                    # Database Schema
│   ├── README.md                # Schema overview, design decisions
│   ├── core/                    # Users, teams, sessions
│   ├── playbooks/               # Playbooks, sections, plays
│   ├── canvas/                  # Players, drawings
│   ├── organization/            # Tags, formations, concepts
│   └── audit.md                 # Audit logging
│
├── deployment/                  # Infrastructure & Deployment
│   ├── README.md                # Deployment overview
│   ├── infrastructure.md        # Railway, DNS, SSL
│   ├── environments.md          # Local, staging, production
│   └── branch-strategy.md       # Git workflow
│
├── guides/                      # Development Guides
│   ├── architecture.md          # Technical architecture
│   ├── sql-guidelines.md        # SQL coding standards
│   └── enhancement-roadmap.md   # Future enhancements
│
├── styling/                     # Style & Design System
│   ├── style-guide.md           # CSS conventions, theme system
│   └── style-components.md      # Component styling patterns
│
└── plans/                       # Implementation Plans
    └── *.md                     # Active implementation plans
```

---

## 🤖 For AI Agents

### Efficient Context Loading

**Instead of loading entire large files, load only what you need:**

- **Example 1:** "Add a new button variant"
  - Load: `components/README.md` (find Button location)
  - Load: `components/foundational/buttons.md` (Button specs)
  - **Total: ~400 lines** vs 1,638 lines in old COMPONENT_CATALOG.md

- **Example 2:** "Modify play animation speed"
  - Load: `features/animation/play-animation.md`
  - **Total: ~250 lines** vs 904 lines in old DESIGN_DOCUMENT.md

- **Example 3:** "Add new database table for notes"
  - Load: `database/README.md` (understand schema patterns)
  - Load: `database/playbooks/plays.md` (see similar table)
  - **Total: ~500 lines** vs 801 lines in old DATABASE_ARCHITECTURE.md

### Cross-Reference Pattern

Files use relative paths to reference related documentation:

```markdown
## See Also
- [Related Feature](../other-category/related-file.md)
- [Database Table](../../database/domain/table.md)
- [UI Component](../../components/category/component.md#section)
```

---

## 📝 Documentation Standards

### File Naming Convention

- **Use kebab-case** for all files: `toolbar-tools.md`, not `ToolbarTools.md`
- **Be descriptive**: `form-inputs.md` not `inputs.md` or `components.md`
- **Group related content**: Keep files focused on single topics

### File Size Guidelines

- **Target:** 200-400 lines per file
- **Maximum:** 500 lines (if exceeding, consider splitting)
- **Minimum:** 100 lines (avoid overly fragmented files)

**Why these limits?**
- AI agents can load ~3-5 files efficiently in one context window
- Humans can scan a 300-line file quickly
- Keeps focus on single topics

### Required File Structure

Every documentation file should include:

```markdown
# [Topic Name]

## Overview
[1-3 sentences explaining what this document covers]

## [Main Content Sections]
[The bulk of your documentation]

## See Also
- [Related Topic 1](../category/file.md)
- [Related Topic 2](../../other-category/file.md)
```

---

## ✏️ Adding New Documentation

### Step 1: Determine the Category

Ask yourself: **What type of information is this?**

| Information Type | Directory | Example |
|-----------------|-----------|---------|
| UI component (shadcn/ui or custom) | `components/` | New dialog component |
| Application feature | `features/` | New export feature |
| Database table or schema | `database/` | New "comments" table |
| Deployment/infrastructure | `deployment/` | New CI/CD pipeline |
| Code guidelines or patterns | `guides/` | Testing standards |
| CSS/styling conventions | `styling/` | New color tokens |

### Step 2: Create a Focused File

```bash
# Create file in appropriate directory
touch features/new-feature/feature-name.md

# Or if adding to existing subdirectory
touch features/play-editor/new-tool.md
```

### Step 3: Write Using Standard Template

```markdown
# [Feature/Component Name]

## Overview
Brief description (1-3 sentences).

## Usage
How users interact with this feature.

## Technical Implementation
Code locations, key files, architecture decisions.

## API Endpoints (if applicable)
- `GET /api/resource` - Description
- `POST /api/resource` - Description

## Database Tables (if applicable)
- **Table:** `table_name`
- **See:** [Database docs](../../database/category/table.md)

## See Also
- [Related Feature](./related-file.md)
- [UI Component](../../components/category/component.md)
```

### Step 4: Add to README Index

Update the relevant `README.md` file to include your new documentation:

```markdown
## [Category Name]

- [Existing Item](./existing.md)
- [Your New Item](./your-new-file.md) <!-- Add this line -->
```

### Step 5: Add Cross-References

If your documentation relates to other areas:
- Link to database tables your feature uses
- Link to UI components your feature uses
- Link to related features

---

## 🔄 Updating Existing Documentation

### When to Split a File

**Split when:**
- File exceeds 500 lines
- File covers multiple distinct topics
- File is hard to navigate
- AI agents would benefit from more granular loading

**How to split:**
1. Identify natural topic boundaries
2. Create new files for each subtopic
3. Update parent README to list new files
4. Add cross-references between split files
5. Delete original large file

### When to Merge Files

**Merge when:**
- Multiple files cover same topic but are < 100 lines each
- Split was too granular (hurts navigation)
- Content is tightly coupled and hard to separate

### Maintaining Cross-References

**When you move or rename content:**
1. Search for old filename in all docs: `grep -r "old-file.md" docs/`
2. Update all references to use new path
3. Test links work correctly

---

## 🧭 Cross-Referencing Best Practices

### Use Relative Paths

**✅ Correct:**
```markdown
See [Players Table](../../database/canvas/players.md)
See [Button Component](../foundational/buttons.md)
```

**❌ Incorrect:**
```markdown
See [Players Table](/database/canvas/players.md)  # Absolute path
See [Button Component](components/foundational/buttons.md)  # Missing ../
```

### Link to Specific Sections

Use `#section-name` anchors:

```markdown
See [Button Sizes](./buttons.md#sizes)
See [Database Indexes](../../database/README.md#indexing-strategy)
```

### Standard "See Also" Section

Every file should end with relevant cross-references:

```markdown
## See Also

**Related Features:**
- [Feature A](../category/feature-a.md)

**UI Components:**
- [Component X](../../components/category/component-x.md)

**Database:**
- [Table Y](../../database/domain/table-y.md)
```

---

## 🎨 Markdown Formatting Standards

### Code Blocks

Always specify language for syntax highlighting:

````markdown
```typescript
// TypeScript code
const example: string = "hello";
```

```sql
-- SQL code
SELECT * FROM users;
```

```bash
# Bash commands
npm install package
```
````

### Tables

Use GitHub-flavored markdown tables:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
```

### Headings

- Use `#` for file title (only one per file)
- Use `##` for main sections
- Use `###` for subsections
- Don't skip heading levels

---

## 🔍 Finding Information

### By Component

1. Start: `components/README.md` (quick lookup table)
2. Navigate to category: `foundational/`, `overlay/`, etc.
3. Open specific component file

### By Feature

1. Start: `features/README.md` (feature overview)
2. Navigate to feature area: `play-editor/`, `playbook/`, etc.
3. Open specific feature file

### By Database Table

1. Start: `database/README.md` (schema overview)
2. Navigate to domain: `core/`, `playbooks/`, etc.
3. Open specific table file

### Full-Text Search

If you know what you're looking for but not where:

```bash
# Search all markdown files
grep -r "search term" docs/**/*.md

# Search specific directory
grep -r "search term" docs/features/**/*.md
```

---

## 📚 Documentation Philosophy

### Why This Structure?

**For Humans:**
- Easy to navigate and find information
- Logical categorization
- Scannable file sizes

**For AI Agents:**
- Minimal context loading (load only what's needed)
- Clear boundaries between topics
- Predictable structure for parsing

### Principles

1. **Single Responsibility** - Each file covers one topic
2. **Self-Contained** - Files don't require reading others (but can reference)
3. **Cross-Referenced** - Related files are linked
4. **Consistent Structure** - Same format across all files
5. **Right-Sized** - Not too large, not too fragmented

---

## 🚀 Getting Started

**New to PlaySmith?** Start here:
1. Read `guides/architecture.md` - Understand the technical foundation
2. Browse `features/README.md` - See what the app does
3. Check `components/README.md` - Learn the UI component library

**Building a feature?** Follow this flow:
1. `features/[area]/` - Understand feature requirements
2. `components/` - Find UI components to use
3. `database/` - Design database changes if needed
4. `deployment/` - Plan deployment if infrastructure changes

**Fixing a bug?** Use targeted loading:
1. Find the feature file (`features/`)
2. Check related database tables (`database/`)
3. Review component usage (`components/`)

---

## 💡 Best Practices Summary

### Do:
✅ Keep files focused (one topic per file)
✅ Use descriptive, kebab-case filenames
✅ Add "See Also" cross-references
✅ Target 200-400 lines per file
✅ Update README indexes when adding files
✅ Use relative paths for links

### Don't:
❌ Create files >500 lines (split them)
❌ Use absolute paths in cross-references
❌ Duplicate information across files
❌ Create orphan files without README links
❌ Skip cross-references to related docs

---

## 📞 Questions or Suggestions?

This documentation structure is designed to evolve. If you find:
- Files that should be split or merged
- Better categorization schemes
- Missing cross-references
- Unclear organization

Feel free to restructure and improve! Just follow the standards above and update cross-references when moving content.

---

**Last Updated:** 2025-01
**Maintained By:** PlaySmith Development Team
