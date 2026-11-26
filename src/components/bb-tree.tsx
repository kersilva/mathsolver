import { useRef, type PointerEvent } from 'react'
import { fmt, type BBNode, type Status } from '@/lib/knapsack'

const COLORS: Record<Status, { fill: string; stroke: string }> = {
  active: { fill: '#1e293b', stroke: '#475569' },
  best: { fill: '#064e3b', stroke: '#10b981' },
  pruned_weight: { fill: '#450a0a', stroke: '#f43f5e' },
  pruned_bound: { fill: '#451a03', stroke: '#f59e0b' },
}

const CARD_W = 120
const CARD_H = 70
const PAD = 110

export function BBTree({ nodes }: { nodes: BBNode[] }) {
  const box = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)

  const xs = nodes.map(n => n.x)
  const minX = Math.min(...xs)
  const width = Math.max(...xs) - minX + PAD * 2
  const height = Math.max(...nodes.map(n => n.y)) + 100

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = box.current!
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !box.current) return
    box.current.scrollLeft = d.left - (e.clientX - d.x)
    box.current.scrollTop = d.top - (e.clientY - d.y)
  }
  const onUp = () => {
    drag.current = null
  }

  return (
    <div
      ref={box}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      className="h-full cursor-grab select-none overflow-auto active:cursor-grabbing"
    >
      <svg width={width} height={height} className="block">
        <g transform={`translate(${PAD - minX}, 0)`}>
          {nodes.flatMap(p =>
            p.children.map(c => (
              <g key={c.id}>
                <line
                  x1={p.x} y1={p.y + CARD_H / 2} x2={c.x} y2={c.y - CARD_H / 2}
                  stroke="#475569" strokeWidth={2}
                />
                <text
                  x={(p.x + c.x) / 2 + (c.x < p.x ? -15 : 15)}
                  y={(p.y + c.y) / 2}
                  fill="#cbd5e1" fontSize={12} fontWeight="bold" textAnchor="middle"
                >
                  {c.decision}
                </text>
              </g>
            )),
          )}
          {nodes.map(n => (
            <Card key={n.id} node={n} />
          ))}
        </g>
      </svg>
    </div>
  )
}

function Card({ node: n }: { node: BBNode }) {
  const { fill, stroke } = COLORS[n.status]
  const top = n.y - CARD_H / 2
  const bottom = top + CARD_H

  return (
    <g>
      <text x={n.x} y={top - 8} fill="#f8fafc" fontSize={14} fontWeight="bold" textAnchor="middle">
        {n.id}
      </text>
      <rect
        x={n.x - CARD_W / 2} y={top} width={CARD_W} height={CARD_H} rx={8}
        fill={fill} stroke={stroke} strokeWidth={2}
      />
      {n.status === 'pruned_weight' ? (
        <>
          <text x={n.x} y={n.y + 5} fill="#f8fafc" fontSize={12} textAnchor="middle">
            {`w = ${n.weight}`}
          </text>
          <text x={n.x} y={bottom + 28} fill="#ef4444" fontSize={26} fontWeight="bold" textAnchor="middle">
            ✕
          </text>
        </>
      ) : (
        <>
          <text x={n.x} y={n.y - 9} fill="#f8fafc" fontSize={12} textAnchor="middle">
            {`w = ${n.weight}  v = ${n.profit}`}
          </text>
          <text x={n.x} y={n.y + 13} fill="#f8fafc" fontSize={12} textAnchor="middle">
            {`ub = ${fmt(n.bound, 1)}`}
          </text>
          <text
            x={n.x} y={bottom + 18} fontSize={11} textAnchor="middle"
            fill={n.status === 'pruned_bound' ? '#f59e0b' : '#94a3b8'}
          >
            {n.status === 'pruned_bound' ? n.reason : n.ub && `ub = ${n.ub}`}
          </text>
        </>
      )}
    </g>
  )
}
