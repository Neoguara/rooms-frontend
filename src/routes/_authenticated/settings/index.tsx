import { ConfiguracoesPage } from '#/components/settings/ConfiguracoesPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/')({
  component: ConfiguracoesPage,
})

// function RouteComponent() {
//   return <div>Hello "/configuracoes/"!</div>
// }
