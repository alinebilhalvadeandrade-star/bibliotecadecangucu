import { useEffect } from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotFoundPage } from '@/components/error-pages'
import { SiteHeader, SiteFooter } from '@/components/site-shell'

import '../styles.css'

const siteName = 'Biblioteca Municipal Clóvis Rocha Moreira'
const siteDescription =
  'Consulte o acervo, reserve livros e acompanhe quais títulos estão emprestados.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: siteName,
      },
      {
        name: 'description',
        content: siteDescription,
      },
      {
        property: 'og:title',
        content: siteName,
      },
      {
        property: 'og:description',
        content: siteDescription,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Source+Sans+3:wght@400;500;600;700&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthLinkForwarder />
        <TooltipProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </TooltipProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}

const AUTH_TOKENS = [
  'invite_token',
  'recovery_token',
  'confirmation_token',
  'email_change_token',
]

/** E-mails do Identity apontam para a raiz do site; leva o token para a área da equipe. */
function AuthLinkForwarder() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (
      window.location.pathname !== '/gestao/entrar' &&
      AUTH_TOKENS.some((t) => hash.has(t))
    ) {
      window.location.replace(`/gestao/entrar${window.location.hash}`)
    }
  }, [])
  return null
}
