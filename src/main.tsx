import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import * as TanStackQueryProvider from '@/integrations/tanstack-query/root-provider.tsx'
import { routeTree } from '@/routeTree.gen'
import '@/styles/index.css'
import 'overlayscrollbars/overlayscrollbars.css'
import { APIProvider, useAPI } from './hooks/useAPI'
import { AuthProvider } from './components/auth-provider'

// Create a new router instance
const TanStackQueryProviderContext = TanStackQueryProvider.getContext()

const router = createRouter({
    routeTree,
    scrollToTopSelectors: ['div[data-overlayscrollbars-contents]'],
    context: {
        queryClient: undefined!,
        api: undefined!,
    },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

function App() {
    return (
        <RouterProvider
            router={router}
            context={{
                api: useAPI().api,
                queryClient: TanStackQueryProviderContext.queryClient,
            }}
        />
    )
}

// Render the app
const rootElement = document.getElementById('app')

if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)

    root.render(
        <StrictMode>
            <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
                <APIProvider {...TanStackQueryProviderContext}>
                    <AuthProvider>
                        <OverlayScrollbarsComponent style={{ height: '100vh' }}>
                            <App />
                        </OverlayScrollbarsComponent>
                    </AuthProvider>
                </APIProvider>
            </TanStackQueryProvider.Provider>
        </StrictMode >
    )
}
