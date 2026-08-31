# Painel Rede de Frios — NTVS

Painel interno de controle de estoque, validade e disponibilidade de imunobiológicos (vacinas) e insumos da Rede de Frios do **Núcleo de Vigilância Epidemiológica e Zoonoses (NTVS)**.

## Sobre o projeto

Aplicação web de página única (single-page), sem build/framework, que sincroniza os dados em tempo real com o Firebase Firestore. Permite que a equipe acompanhe:

- Estoque atual x estoque mínimo de cada item
- Validade de imunobiológicos (com alertas de vencimento próximo/vencido)
- Status geral: disponível / em atenção / crítico
- Separação entre **imunobiológicos** e **insumos**

## Stack

- HTML, CSS e JavaScript puros (sem framework)
- [Firebase Firestore](https://firebase.google.com/docs/firestore) — banco de dados em tempo real
- [Firebase Authentication](https://firebase.google.com/docs/auth) — login por e-mail/senha para habilitar edição

## Como funciona o acesso

- **Leitura**: pública, qualquer pessoa com o link vê o painel atualizado em tempo real.
- **Edição** (adicionar, editar, excluir itens): exige login. Sem login, o painel funciona em "modo leitura".

> ⚠️ A proteção real dos dados é feita pelas **regras de segurança do Firestore** no console do Firebase (quem pode ler e quem pode escrever), não pela chave de API presente no código — isso é esperado em apps Firebase client-side. Antes de tornar o repositório público, confirme que as regras do Firestore restringem escrita a usuários autenticados.

## Como rodar localmente

Por ser um único arquivo HTML sem dependências de build, basta abrir `index.html` no navegador, ou servir a pasta com qualquer servidor estático, por exemplo:

```bash
npx serve .
```

## Configuração do Firebase

O projeto usa um projeto Firebase já existente, configurado diretamente no `index.html` (objeto `firebaseConfig`). Para apontar para outro projeto Firebase, edite esse objeto com as credenciais do seu projeto no [console do Firebase](https://console.firebase.google.com/).

## Roadmap / melhorias planejadas

- [ ] (adicionar aqui os próximos passos do projeto)

## Contexto

Este projeto faz parte das atividades desenvolvidas por meio de um programa de bolsa, em conjunto com o site institucional de apresentação do NTVS.
