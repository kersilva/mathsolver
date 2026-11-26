export type Item = { id: number; name: string; weight: number; value: number }
export type Status = 'active' | 'best' | 'pruned_weight' | 'pruned_bound'

export type BBNode = {
  id: number
  level: number
  profit: number
  weight: number
  bound: number
  ub: string
  decision: string
  status: Status
  reason: string
  children: BBNode[]
  x: number
  y: number
}

export const fmt = (n: number, digits = 2) =>
  (Number.isInteger(n) ? String(n) : n.toFixed(digits)).replace('.', ',')

// Branch and Bound da mochila 0/1, com a regra de poda e o limitante do professor:
// ub = v + (W - w) * (v_{i+1} / w_{i+1})
export function solveKnapsack(items: Item[], W: number) {
  const sorted = items
    .map((it, i) => ({ ...it, pos: i + 1, density: it.value / it.weight }))
    .sort((a, b) => b.density - a.density)

  const bound = (profit: number, weight: number, level: number) => {
    if (weight > W) return { value: 0, ub: '' }
    const rest = W - weight
    const next = sorted[level + 1]
    if (!next) return { value: profit, ub: `${profit}` }
    return {
      value: profit + rest * next.density,
      ub: `${profit}+${rest}·${fmt(next.density)}`,
    }
  }

  let nextId = 1
  const make = (level: number, profit: number, weight: number, decision: string): BBNode => {
    const b = bound(profit, weight, level)
    return {
      id: nextId++, level, profit, weight, bound: b.value, ub: b.ub,
      decision, status: 'active', reason: '', children: [], x: 0, y: 0,
    }
  }

  const root = make(-1, 0, 0, '')
  const all = [root]
  const queue = [root]
  let best = null as BBNode | null
  let maxProfit = -1

  const pruneByBound = (n: BBNode) => {
    n.status = 'pruned_bound'
    n.reason = `inferior ao nó ${best?.id ?? ''}`
  }

  while (queue.length > 0) {
    queue.sort((a, b) => b.bound - a.bound)
    const curr = queue.shift()!

    if (curr.weight <= W && curr.profit > maxProfit) {
      maxProfit = curr.profit
      best = curr
    }
    if (curr.bound <= maxProfit && curr.id !== 1) {
      pruneByBound(curr)
      continue
    }
    if (curr.level === sorted.length - 1) continue

    const item = sorted[curr.level + 1]
    const left = make(curr.level + 1, curr.profit + item.value, curr.weight + item.weight, `c/${item.pos}`)
    const right = make(curr.level + 1, curr.profit, curr.weight, `s/${item.pos}`)
    curr.children.push(left, right)
    all.push(left, right)

    if (left.weight > W) {
      left.status = 'pruned_weight'
    } else {
      if (left.profit > maxProfit) {
        maxProfit = left.profit
        best = left
      }
      if (left.bound > maxProfit) queue.push(left)
      else pruneByBound(left)
    }

    if (right.bound > maxProfit) queue.push(right)
    else pruneByBound(right)
  }

  if (best) best.status = 'best'

  let leaf = 0
  const place = (n: BBNode, depth: number) => {
    n.y = depth * 140 + 80
    if (n.children.length === 0) {
      n.x = leaf++ * 190
    } else {
      n.children.forEach(c => place(c, depth + 1))
      n.x = (n.children[0].x + n.children[n.children.length - 1].x) / 2
    }
  }
  place(root, 0)

  return { items: sorted, nodes: all }
}
