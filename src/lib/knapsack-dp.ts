export type DpItem = { p: number; v: number }

export type Cell = {
  i: number
  b: number
  value: number
  prev: number
  take: number | null
  kind: 'base' | 'nao-cabe' | 'compara'
  calc: string
}

// Recorrência do PDF (Aula 07):
// T[i,b] = T[i-1,b]                            se p_i > b
// T[i,b] = max(T[i-1,b], T[i-1,b-p_i] + v_i)   se p_i <= b
// T[0,b] = 0 e T[i,0] = 0
export function solveDp(items: DpItem[], C: number) {
  const N = items.length
  const T: Cell[][] = []

  for (let i = 0; i <= N; i++) {
    T.push([])
    for (let b = 0; b <= C; b++) {
      if (i === 0 || b === 0) {
        T[i].push({ i, b, value: 0, prev: 0, take: null, kind: 'base', calc: '' })
        continue
      }
      const { p, v } = items[i - 1]
      const prev = T[i - 1][b].value
      if (p > b) {
        T[i].push({
          i, b, value: prev, prev, take: null, kind: 'nao-cabe',
          calc: `p${i} = ${p} > ${b} → T[${i - 1},${b}] = ${prev}`,
        })
      } else {
        const rest = T[i - 1][b - p].value
        const take = rest + v
        const value = Math.max(prev, take)
        T[i].push({
          i, b, value, prev, take, kind: 'compara',
          calc: `p${i} = ${p} ≤ ${b} → max(T[${i - 1},${b}] = ${prev}, T[${i - 1},${b - p}] + v${i} = ${rest} + ${v} = ${take}) = ${value}`,
        })
      }
    }
  }

  // Reconstrução: começa em T[N,C] e segue a origem de cada escolha.
  // Empate entre "fica de fora" e "entra" → o item fica de fora.
  const path: { i: number; b: number }[] = []
  const selected: number[] = []
  const trace: string[] = []
  let b = C

  for (let i = N; i >= 1; i--) {
    const c = T[i][b]
    const { p, v } = items[i - 1]
    path.push({ i, b })

    if (c.kind === 'compara' && c.take !== null && c.take > c.prev) {
      selected.push(i)
      trace.push(`T[${i},${b}] = ${c.value} veio de T[${i - 1},${b - p}] + v${i}: item ${i} entra; capacidade ${b} → ${b - p}`)
      b -= p
    } else if (c.kind === 'nao-cabe') {
      trace.push(`T[${i},${b}] = ${c.value} veio de T[${i - 1},${b}]: item ${i} não cabe (p${i} = ${p} > ${b})`)
    } else if (c.kind === 'base') {
      trace.push(`T[${i},${b}] = 0: sem capacidade, item ${i} fica de fora`)
    } else {
      trace.push(`T[${i},${b}] = ${c.value} veio de T[${i - 1},${b}]: item ${i} fica de fora`)
    }
  }

  return { table: T, path, selected, trace, best: T[N][C].value }
}
