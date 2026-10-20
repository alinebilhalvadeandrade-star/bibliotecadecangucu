# Biblioteca Municipal Clóvis Rocha Moreira

Site de biblioteca onde o leitor consulta o acervo, reserva um livro para retirar no balcão e acompanha quais títulos estão emprestados.

## Funcionalidades

- **Acervo** (`/`) — todos os títulos com busca por título/autor e filtros por gênero e situação (disponível, emprestado, reservado).
- **Detalhe do livro** (`/livro/:id`) — sinopse, dados da obra e situação de cada exemplar, com a próxima devolução prevista.
- **Reserva** — o leitor informa nome e e-mail; um exemplar fica guardado por 3 dias. Reservas não retiradas expiram sozinhas e o exemplar volta ao acervo.
- **Emprestados** (`/emprestados`) — lista dos livros com leitores e das reservas aguardando retirada, com datas de devolução.
- **Minhas reservas** (`/minhas-reservas`) — consulta pelo e-mail, com histórico e cancelamento de reservas.

## Tecnologias

TanStack Start (React 19), Tailwind CSS 4 + shadcn/ui, Netlify Database (Postgres) com Drizzle ORM e Netlify Image CDN.

## Rodando localmente

```bash
pnpm install
netlify dev
```

O `netlify dev` emula o banco de dados e aplica as migrations (incluindo o acervo inicial).

## Próximos passos

- Painel do balcão para bibliotecários (com login): confirmar retirada, registrar devolução, renovar empréstimos e cadastrar livros.
- Avisos por e-mail de reserva confirmada e devolução próxima.
