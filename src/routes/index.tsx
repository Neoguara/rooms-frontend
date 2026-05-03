import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
    beforeLoad: ({
    context: {
      authentication: { isLogged },
    },
  }) => {
    if (!isLogged()) {
      throw redirect({
        to: '/login',
      })
    } else {
      throw redirect({ to: '/dashboard' })
    }
  },
})
