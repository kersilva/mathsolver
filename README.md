# Mochila 0/1

Aplicação didática para explorar duas formas de resolver o problema da mochila 0/1: **Branch and Bound** e **programação dinâmica**.

O projeto permite alterar os itens e a capacidade da mochila e visualizar como cada método encontra uma solução de valor máximo.

## Aulas

- **Aula 06 — Branch and Bound:** ordena os itens por valor/peso e mostra a árvore de busca. Os nós indicam peso, valor, limitante superior e se foram podados.
- **Aula 07 — Programação dinâmica:** monta a tabela `T[i,b]`, destaca valores relacionados e mostra a reconstrução dos itens escolhidos.

Use a navegação lateral para alternar entre as aulas.

## Tecnologias

- React 19 e TypeScript
- Vite
- TanStack Router
- Tailwind CSS 4

## Requisitos

- Node.js 22 ou superior
- npm

## Executar localmente

```bash
npm ci
npm run dev
```

O Vite mostra no terminal o endereço local para abrir no navegador.

Para gerar e pré-visualizar a versão de produção:

```bash
npm run build
npm run preview
```

## Publicar no Vercel

Importe o repositório no Vercel. As configurações padrão do projeto são:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm ci`

Não é necessário definir `VITE_BASE_PATH` no Vercel. O valor padrão (`/`) serve para o domínio do Vercel.

## Publicar no GitHub Pages

O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) compila e publica o app quando há push para `main`. Também pode ser iniciado manualmente pela aba **Actions** do GitHub.

No repositório, abra **Settings → Pages → Build and deployment** e escolha **GitHub Actions** como fonte. O workflow define `VITE_BASE_PATH` com o nome do repositório para que os arquivos e rotas funcionem em sites de projeto.

Se a branch principal tiver outro nome, altere `main` na seção `on.push.branches` do workflow.

## Estrutura do projeto

```text
src/
├── components/      # Layout, árvore Branch and Bound e componentes de interface
├── lib/             # Implementações dos algoritmos
├── pages/           # Telas das Aulas 06 e 07
├── router.tsx       # Rotas da aplicação
└── main.tsx         # Inicialização do React
.github/workflows/   # Publicação no GitHub Pages
```

## Scripts

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento do Vite. |
| `npm run build` | Verifica os tipos TypeScript e gera `dist/`. |
| `npm run preview` | Serve localmente o build de produção. |
