# context-bar

A Claude Code mod that shows a live context-window bar above the prompt.

- Header: tokens used of the window, where auto-compact kicks in, and a percent badge (green / yellow / red)
- A stacked bar split by category
- Legend: system prompt, tools, mcp tools, agents, memory files, skills, messages, free — with token counts and percentages
- Refreshes every 2 seconds, shown by default; `/context-bar` toggles it

Data comes from `$.session.usage({ breakdown: 'summary' })`, the same numbers `/context` reports.

## Install

Needs a Claude Code build with function-hook mods (developed on 2.1.289).

```sh
git clone https://github.com/Olympus-Work/context-bar ~/Gits/context-bar
claude --plugin-dir ~/Gits/context-bar
```

To load it in every session, set the `CLAUDE_CODE_PLUGIN_DIRS` environment variable to the cloned folder.

## Files

- `.claude-plugin/plugin.json` — manifest
- `hooks/hooks.json` — points at the module
- `hooks/register.tsx` — the command, the timer and the render hook

## Notes

Categories are matched by the names Claude Code reports (e.g. "MCP tools"). If a future release renames one, its legend entry will read 0 until the matcher in `register.tsx` is updated.
