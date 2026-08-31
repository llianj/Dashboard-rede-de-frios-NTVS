# Painel Rede de Frios — NTVS

Painel interno de controle de estoque, validade e disponibilidade de imunobiológicos (vacinas) e insumos da Rede de Frios do **Núcleo de Vigilância Epidemiológica e Zoonoses (NTVS)**.

## Sobre o projeto

Aplicação web que sincroniza os dados em tempo real com o Firebase Firestore. Permite que a equipe acompanhe:

- Estoque atual x estoque mínimo de cada item
- Validade de imunobiológicos (com alertas de vencimento próximo/vencido)
- Status geral: disponível / em atenção / crítico
- Separação entre **imunobiológicos** e **insumos**

## Stack

- [Vite](https://vitejs.dev/) — build tool e servidor de desenvolvimento
- HTML, CSS e JavaScript (ES Modules)
- [Firebase Firestore](https://firebase.google.com/docs/firestore) — banco de dados em tempo real
- [Firebase Authentication](https://firebase.google.com/docs/auth) — login por e-mail/senha para habilitar edição

## Estrutura do projeto

```
├── index.html
├── js/
│   ├── main.js             # lógica principal do app (Firestore, Auth, render)
│   ├── firebase-config.js  # config do Firebase, lida de variáveis de ambiente
│   └── catalog.js          # catálogo de itens (imunobiológicos e insumos)
├── css/
│   └── style.css
├── .env                    # config real do Firebase (NÃO versionado)
├── .env.example             # modelo do .env (versionado)
└── package.json
```

## Como rodar localmente

**Pré-requisito**: [Node.js](https://nodejs.org/) instalado (versão 18+).

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie o arquivo de exemplo e preencha com as credenciais do seu projeto Firebase (Console do Firebase → Configurações do projeto → Seus apps):
   ```bash
   cp .env.example .env
   ```
3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   O terminal vai mostrar um link (geralmente `http://localhost:5173`).

## Build de produção

```bash
npm run build
```
Gera a pasta `dist/` pronta para deploy. Para conferir localmente como fica a versão de produção:
```bash
npm run preview
```

## Deploy no Vercel

1. Suba este repositório no GitHub (já com `.env` fora do versionamento — ele fica de fora graças ao `.gitignore`).
2. No [Vercel](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. O Vercel detecta automaticamente que é um projeto Vite (build command `vite build`, output `dist`) — não precisa mudar nada aí.
4. Em **Settings → Environment Variables**, adicione as mesmas variáveis do seu `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
5. Clique em **Deploy**. A cada `git push` na branch principal, o Vercel gera um novo deploy automaticamente.

> ⚠️ A chave do Firebase que aparece no `.env` não é um segredo tradicional — é normal ela existir no bundle final que roda no navegador (é assim que apps Firebase client-side funcionam). A proteção real dos dados vem das **regras de segurança do Firestore**, configuradas no Console do Firebase, que definem quem pode ler e quem pode escrever em cada coleção.

## Como funciona o acesso

- **Leitura**: pública, qualquer pessoa com o link vê o painel atualizado em tempo real.
- **Edição** (adicionar, editar, excluir itens): exige login. Sem login, o painel funciona em "modo leitura".

## Roadmap / melhorias planejadas

- [ ] Fluxo de cadastro de novos usuários
- [ ] Funcionalidade de troca de senha
- [ ] Tela de login dedicada
- [ ] Revisão de design

## Contexto

Este projeto faz parte das atividades desenvolvidas por meio de um programa de bolsa, em conjunto com o site institucional de apresentação do NTVS.
