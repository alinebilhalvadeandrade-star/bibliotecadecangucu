import { useEffect, useState, type FormEvent } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  AuthError,
  acceptInvite,
  handleAuthCallback,
  login,
  requestPasswordRecovery,
  updateUser,
} from '@netlify/identity'
import { KeyRound, Loader2, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { getStaffSession } from '@/lib/staff.functions'

export const Route = createFileRoute('/gestao/entrar')({
  head: () => ({
    meta: [
      { title: 'Acesso da equipe — Biblioteca Municipal Clóvis Rocha Moreira' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: StaffLoginPage,
})

type Mode =
  | { kind: 'loading' }
  | { kind: 'login' }
  | { kind: 'forgot' }
  | { kind: 'invite'; token: string }
  | { kind: 'recovery' }

function errorMessage(error: unknown) {
  if (error instanceof AuthError) {
    if (error.status === 401 || error.status === 400)
      return 'E-mail ou senha incorretos.'
    if (error.status === 422)
      return 'Senha fraca ou dados inválidos. Use ao menos 8 caracteres.'
  }
  return 'Não foi possível concluir agora. Tente novamente.'
}

function StaffLoginPage() {
  const router = useRouter()
  const navigate = Route.useNavigate()
  const [mode, setMode] = useState<Mode>({ kind: 'loading' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Links de convite e de recuperação de senha chegam com o token no hash da URL.
  useEffect(() => {
    let active = true
    handleAuthCallback()
      .then((result) => {
        if (!active) return
        window.history.replaceState(null, '', window.location.pathname)
        if (result?.type === 'invite' && result.token)
          setMode({ kind: 'invite', token: result.token })
        else if (result?.type === 'recovery') setMode({ kind: 'recovery' })
        else setMode({ kind: 'login' })
      })
      .catch(() => {
        if (!active) return
        setError(
          'O link expirou ou já foi usado. Peça um novo convite ou recupere a senha.',
        )
        setMode({ kind: 'login' })
      })
    return () => {
      active = false
    }
  }, [])

  async function enter() {
    await router.invalidate()
    const session = await getStaffSession()
    if (session?.staff) {
      await navigate({ to: '/gestao' })
    } else {
      setError(
        'Sua conta ainda não tem permissão de bibliotecário. Peça à administração para liberar o acesso.',
      )
      setMode({ kind: 'login' })
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const fields = new FormData(event.currentTarget)
    const email = String(fields.get('email') ?? '')
    const password = String(fields.get('password') ?? '')
    setPending(true)
    setError(null)
    setNotice(null)
    try {
      if (mode.kind === 'login') {
        await login(email, password)
        await enter()
      } else if (mode.kind === 'forgot') {
        await requestPasswordRecovery(email)
        setNotice(
          'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.',
        )
        setMode({ kind: 'login' })
      } else if (mode.kind === 'invite') {
        await acceptInvite(mode.token, password)
        toast.success('Conta criada. Bem-vindo(a) à equipe!')
        await enter()
      } else if (mode.kind === 'recovery') {
        await updateUser({ password })
        toast.success('Senha atualizada.')
        await enter()
      }
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setPending(false)
    }
  }

  const copy = {
    loading: { title: 'Acesso da equipe', text: '' },
    login: {
      title: 'Acesso da equipe',
      text: 'Área restrita aos bibliotecários para cadastrar livros no acervo.',
    },
    forgot: {
      title: 'Recuperar senha',
      text: 'Informe seu e-mail para receber um link de redefinição.',
    },
    invite: {
      title: 'Aceitar convite',
      text: 'Crie uma senha para ativar sua conta da equipe.',
    },
    recovery: {
      title: 'Nova senha',
      text: 'Defina uma nova senha para sua conta.',
    },
  }[mode.kind]

  const asksEmail = mode.kind === 'login' || mode.kind === 'forgot'
  const asksPassword = mode.kind !== 'forgot'
  const newPassword = mode.kind === 'invite' || mode.kind === 'recovery'

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
        {newPassword ? (
          <KeyRound className="size-5" aria-hidden />
        ) : (
          <LockKeyhole className="size-5" aria-hidden />
        )}
      </span>
      <h1 className="mt-5 text-3xl font-semibold">{copy.title}</h1>
      {copy.text && <p className="mt-2 text-muted-foreground">{copy.text}</p>}

      {mode.kind === 'loading' ? (
        <div className="mt-8 space-y-4" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-28" />
        </div>
      ) : (
        <form
          key={mode.kind}
          onSubmit={submit}
          className="mt-8 rounded-xl border bg-card p-6"
        >
          <fieldset disabled={pending} className="space-y-5">
            <legend className="sr-only">{copy.title}</legend>
            {asksEmail && (
              <div className="grid gap-2">
                <Label htmlFor="staff-email">E-mail</Label>
                <Input
                  id="staff-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
            )}
            {asksPassword && (
              <div className="grid gap-2">
                <Label htmlFor="staff-password">
                  {newPassword ? 'Nova senha' : 'Senha'}
                </Label>
                <Input
                  id="staff-password"
                  name="password"
                  type="password"
                  autoComplete={
                    newPassword ? 'new-password' : 'current-password'
                  }
                  minLength={newPassword ? 8 : undefined}
                  required
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm text-success">
                {notice}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button type="submit">
                {pending && (
                  <Loader2 className="animate-spin motion-reduce:animate-none" />
                )}
                {mode.kind === 'login'
                  ? 'Entrar'
                  : mode.kind === 'forgot'
                    ? 'Enviar link'
                    : 'Salvar senha'}
              </Button>
              {mode.kind === 'login' && (
                <Button
                  type="button"
                  variant="link"
                  className="px-0"
                  onClick={() => setMode({ kind: 'forgot' })}
                >
                  Esqueci a senha
                </Button>
              )}
              {mode.kind === 'forgot' && (
                <Button
                  type="button"
                  variant="link"
                  className="px-0"
                  onClick={() => setMode({ kind: 'login' })}
                >
                  Voltar ao login
                </Button>
              )}
            </div>
          </fieldset>
        </form>
      )}
    </div>
  )
}
