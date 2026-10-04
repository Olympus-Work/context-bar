import type { Register } from 'claude-code'

const KEYS = [
  { id: 'system', label: 'system prompt', color: '#7aa2f7', match: (n: string) => n.includes('system prompt') },
  { id: 'tools', label: 'tools', color: '#73daca', match: (n: string) => n.includes('system tools') || n === 'tools' },
  { id: 'mcp', label: 'mcp tools', color: '#bb9af7', match: (n: string) => n.includes('mcp') },
  { id: 'agents', label: 'agents', color: '#9ece6a', match: (n: string) => n.includes('agent') },
  { id: 'memory', label: 'memory files', color: '#e0af68', match: (n: string) => n.includes('memory') },
  { id: 'skills', label: 'skills', color: '#f7a8c8', match: (n: string) => n.includes('skill') },
  { id: 'messages', label: 'messages', color: '#e07b5a', match: (n: string) => n.includes('message') },
] as const

const FREE = '#3b4261'

const fmt = (n: number) =>
  n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${+(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : `${n}`

const pct = (n: number, of: number) => {
  const p = (n / of) * 100
  return p > 0 && p < 0.1 ? '<0.1%' : `${p < 10 ? p.toFixed(1) : Math.round(p)}%`
}

export const register: Register = on => {
  let isOn = true

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'context-bar',
      description: 'Toggle the live context-window bar above the prompt',
    })
    $.clock.every(2000, () => $.ui.invalidate('ui.render'))

    return next(e)
  })

  on('command.run', { command: 'context-bar' }, async $ => {
    isOn = !isOn
    $.ui.invalidate('ui.render')

    return { text: isOn ? 'Context bar shown.' : 'Context bar hidden.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!isOn) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const { context } = await $.session.usage({ breakdown: 'summary' })
    const b = context.breakdown
    if (!b) return <Text dimColor>No context data yet.</Text>

    const total = b.rawMaxTokens
    const sums: Record<string, number> = {}
    for (const c of b.categories) {
      if (c.kind !== 'used') continue
      const k = KEYS.find(key => key.match(c.name.toLowerCase()))
      if (k) sums[k.id] = (sums[k.id] ?? 0) + c.tokens
    }
    const used = b.totalTokens
    const free = Math.max(0, total - used)
    const width = Math.max(20, (e.viewport?.columns ?? 80) - 6)
    const cells = (n: number) => Math.round((n / total) * width)
    const bar = KEYS.map(k => ({ color: k.color, n: cells(sums[k.id] ?? 0) })).filter(s => s.n > 0)
    const filled = bar.reduce((a, s) => a + s.n, 0)
    const percent = Math.round(b.percentage)
    const badge = percent >= 80 ? '#f7768e' : percent >= 60 ? '#e0af68' : '#7ec97e'
    const compactAt = b.autoCompactThreshold

    return (
      <Box flexDirection="column" borderStyle="round" borderColor="#3b4261" paddingX={1}>
        <Box justifyContent="space-between">
          <Text bold color="#e07b5a">◆ context</Text>
          <Text>
            <Text bold>{fmt(used)}</Text>
            <Text dimColor> of {fmt(total)}</Text>
            {compactAt ? <Text dimColor> · compacts at {fmt(compactAt)} </Text> : <Text> </Text>}
            <Text bold color="#1a1b26" backgroundColor={badge}> {percent}% </Text>
          </Text>
        </Box>
        <Text>
          {bar.map(s => <Text backgroundColor={s.color}>{' '.repeat(s.n)}</Text>)}
          <Text backgroundColor={FREE}>{' '.repeat(Math.max(0, width - filled))}</Text>
        </Text>
        <Box flexWrap="wrap" columnGap={3}>
          {KEYS.map(k => (
            <Text>
              <Text backgroundColor={k.color}> </Text> {k.label} {fmt(sums[k.id] ?? 0)}{' '}
              <Text dimColor>{pct(sums[k.id] ?? 0, total)}</Text>
            </Text>
          ))}
          <Text>
            <Text backgroundColor={FREE}> </Text> free {fmt(free)}
          </Text>
        </Box>
      </Box>
    )
  })
}
