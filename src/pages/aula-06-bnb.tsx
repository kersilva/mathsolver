import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BBTree } from '@/components/bb-tree'
import { fmt, solveKnapsack, type Item } from '@/lib/knapsack'

const INITIAL: Item[] = [
  { id: 1, name: 'binóculo', weight: 5, value: 20 },
  { id: 2, name: 'cantil', weight: 4, value: 30 },
  { id: 3, name: 'corda', weight: 2, value: 15 },
  { id: 4, name: 'mosquetão', weight: 7, value: 17 },
  { id: 5, name: 'fósforo', weight: 3, value: 8 },
]

const toNum = (v: string) => Math.max(1, Number(v) || 1)

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded-full ${color}`} />
      {label}
    </span>
  )
}

export function KnapsackPage() {
  const [items, setItems] = useState<Item[]>(INITIAL)
  const [capacity, setCapacity] = useState('10')
  const [result, setResult] = useState(() => solveKnapsack(INITIAL, 10))

  const update = (i: number, patch: Partial<Item>) =>
    setItems(prev => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    const next = [...items]
    const [it] = next.splice(from, 1)
    next.splice(to, 0, it)
    setItems(next)
  }

  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const add = () =>
    setItems([
      ...items,
      { id: Math.max(...items.map(it => it.id)) + 1, name: 'novo item', weight: 5, value: 10 },
    ])

  const calculate = () => setResult(solveKnapsack(items, Number(capacity) || 0))

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background font-sans text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card p-4">
        <h1 className="text-xl font-bold text-emerald-400">Aula 06 · Branch & Bound — Mochila 0/1</h1>
        <div className="flex gap-4 text-xs">
          <Legend color="bg-emerald-500" label="Solução ótima" />
          <Legend color="bg-blue-600" label="Nó promissor" />
          <Legend color="bg-rose-600" label="Podado (peso > W)" />
          <Legend color="bg-amber-600" label="Podado (bound ineficiente)" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-96 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-4">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Capacidade da mochila (W)
            <Input
              type="number"
              min={1}
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              className="font-bold"
            />
          </label>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Itens disponíveis
            </span>
            <Button size="sm" onClick={add}>+ Adicionar item</Button>
          </div>

          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="p-1">Pos</th>
                <th className="p-1 text-left">Objeto</th>
                <th className="p-1">Peso</th>
                <th className="p-1">Valor</th>
                <th className="p-1">Ação</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="border-t border-border">
                  <td className="p-1 text-center font-bold text-emerald-400">{i + 1}</td>
                  <td className="p-1">
                    <Input
                      className="h-7 px-2 text-xs"
                      value={it.name}
                      onChange={e => update(i, { name: e.target.value })}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      className="h-7 w-14 px-1 text-center text-xs"
                      type="number" min={1} value={it.weight}
                      onChange={e => update(i, { weight: toNum(e.target.value) })}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      className="h-7 w-14 px-1 text-center text-xs"
                      type="number" min={1} value={it.value}
                      onChange={e => update(i, { value: toNum(e.target.value) })}
                    />
                  </td>
                  <td className="whitespace-nowrap p-1">
                    <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={() => move(i, i - 1)}>▲</Button>
                    <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={() => move(i, i + 1)}>▼</Button>
                    <Button
                      variant="ghost" size="sm" className="h-7 px-1.5 text-rose-400"
                      disabled={items.length <= 1} onClick={() => remove(i)}
                    >
                      ✕
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Button
            className="w-full bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400"
            onClick={calculate}
          >
            Calcular & gerar árvore
          </Button>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Ordenação por densidade (vᵢ / wᵢ)
            </p>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="p-1">i</th>
                  <th className="p-1 text-left">Objeto</th>
                  <th className="p-1">v</th>
                  <th className="p-1">w</th>
                  <th className="p-1 text-emerald-400">v / w</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map(it => (
                  <tr key={it.id} className="border-t border-border">
                    <td className="p-1 text-center text-muted-foreground">{it.pos}</td>
                    <td className="p-1 font-medium">{it.name}</td>
                    <td className="p-1 text-center">{it.value}</td>
                    <td className="p-1 text-center">{it.weight}</td>
                    <td className="bg-emerald-500/10 p-1 text-center font-bold text-emerald-400">
                      {fmt(it.density)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>

        <main className="relative flex-1 overflow-hidden bg-background">
          <BBTree nodes={result.nodes} />
          <div className="pointer-events-none absolute bottom-4 right-4 rounded border border-border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground">
            Arraste para mover o diagrama
          </div>
        </main>
      </div>
    </div>
  )
}
