Generate a short, clear English Git commit message for the currently staged changes (git add / buffer / index).

Follow these rules strictly:
- Use Conventional Commits format: `<type>`: <short description>
  Types: feat, fix, docs, style, refactor, perf, test, chore, build, ci, revert 等
- Subject line: max 50-72 characters, start with imperative verb (Add, Fix, Update, Refactor...)
- No body or footer unless the change is complex (keep it short!)
- Output ONLY the commit message, nothing else (no quotes, no explanations)

Now generate the message based on the staged diff.