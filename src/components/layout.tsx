import { Link, Outlet } from '@tanstack/react-router'

const AREAS = [
  { to: '/aula-06', titulo: 'Aula 06', descricao: 'Branch and Bound' },
  { to: '/aula-07', titulo: 'Aula 07', descricao: 'Programação dinâmica' },
] as const

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-border bg-card p-3">
        <p className="px-2 pb-3 pt-1 text-sm font-bold text-emerald-400">Mochila 0/1</p>
        {AREAS.map(area => (
          <Link
            key={area.to}
            to={area.to}
            className="rounded-md px-3 py-2 hover:bg-accent"
            activeProps={{ className: 'bg-accent' }}
          >
            <span className="block text-sm font-medium">{area.titulo}</span>
            <span className="block text-xs text-muted-foreground">{area.descricao}</span>
          </Link>
        ))}
      </nav>
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
