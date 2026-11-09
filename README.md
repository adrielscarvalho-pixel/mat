# Pesquisa Trabalho de Matemática — Super Herói

Site interativo desenvolvido para o **Trabalho de Matemática: Super Herói**.

## Funcionalidades Implementadas

- **Tela Inicial de Alto Impacto**:
  - Título superior em duas linhas: **Pesquisa Trabalho de Matemática** e, logo abaixo, **Super Herói**.
  - Botão **Iniciar**: direciona imediatamente para a próxima página da pesquisa (`#pesquisa`).
  - Botão **Sair**: aciona um bloqueio dramático por **5 segundos** exibindo a mensagem **`OS PRIMOS NÃO DEIXARÃO!`** com barra de contagem regressiva em tempo real e efeito sonoro sintetizado.
- **Segunda Página (Central da Pesquisa)**:
  - Verificador interativo de Números Primos com fatoração automática.
  - Registro de Super-Heróis e fórmulas matemáticas com persistência local imediata (`localStorage`) e suporte pronto para **Firebase Firestore** em `firebase-config.js`.

## Como Hospedar no Firebase Hosting (URL Curta `.web.app`)

O repositório já possui os arquivos [`firebase.json`](./firebase.json) e [`.firebaserc`](./.firebaserc) configurados. Para ativar sua URL curta no Firebase Hosting conectada diretamente a este GitHub:

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e clique em **Adicionar projeto** (ex: `mat-super-heroi`).
2. No menu lateral, abra **Criação (Build) → Hosting** e clique em **Vamos começar**.
3. Conecte sua conta do GitHub e selecione o repositório `adrielscarvalho-pixel/mat` (branch `main`).
4. O Firebase publicará automaticamente o site em uma URL curta como `https://mat-super-heroi.web.app`.
