# commit

Analyze staged and unstaged changes, create a meaningful commit message, and push to main.

## Instructions

1. Run `git status` to see all changes (staged, unstaged, untracked)
2. Run `git diff` to see unstaged changes and `git diff --cached` for staged changes
3. If there are unstaged or untracked files that should be committed, stage them with `git add`
4. Analyze the changes and generate a brief, meaningful commit message that:
   - Uses conventional commit format (feat:, fix:, docs:, refactor:, test:, chore:)
   - Summarizes the "why" not the "what"
   - Is concise (ideally under 72 characters for the subject line)
5. Create the commit with the generated message
6. Push to main branch

## Commit Message Format

```
<type>: <brief summary>

<optional body with more detail if needed>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Safety

- Do NOT commit files that appear to contain secrets (.env, credentials, API keys)
- Do NOT force push
- If there are no changes to commit, inform the user
