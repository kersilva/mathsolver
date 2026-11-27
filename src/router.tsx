import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import { Layout } from './components/layout'
import { KnapsackPage } from './pages/aula-06-bnb'
import { DpPage } from './pages/aula-07-dp'

const rootRoute = createRootRoute({ component: Layout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/aula-06' })
  },
})

const aula06Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/aula-06',
  component: KnapsackPage,
})

const aula07Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/aula-07',
  component: DpPage,
})

const routeTree = rootRoute.addChildren([indexRoute, aula06Route, aula07Route])

// Vite's base path is also the router base for GitHub Pages project sites.
export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
