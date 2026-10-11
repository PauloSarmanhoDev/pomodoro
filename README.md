# 🍅 Pomodoro Focus

> Um temporizador Pomodoro moderno, elegante e de alta performance, construído com tecnologias web nativas, suporte completo a **PWA (Progressive Web App)** para instalação no celular e PC, funcionamento 100% offline, sintetizador de som harmônico e gerenciador de tarefas integrado.

![PWA Ready](https://img.shields.io/badge/PWA-Ready-success?style=for-the-badge&logo=pwa)
![Offline First](https://img.shields.io/badge/Offline-100%25-blue?style=for-the-badge)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-orange?style=for-the-badge)
![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)

---

## ✨ Funcionalidades Principais

* **⏱️ Temporizador de Alta Precisão:** Baseado em timestamps absolutos (`Date.now()`), garantindo que o cronômetro não congele ou atrase mesmo quando a aba do navegador estiver em segundo plano ou em modo de economia de energia.
* **📱 Suporte PWA (Instalável em PC e Celular):** Pode ser instalado como aplicativo nativo em Windows, macOS, Linux, Android e iOS diretamente pelo navegador, sem necessidade de app store.
* **📶 Funciona 100% Offline:** Equipado com *Service Worker* que faz cache de todos os recursos da aplicação. Funciona perfeitamente sem conexão com a internet.
* **⭕ Anel de Progresso Circular (SVG Dinâmico):** Visualização fluida do tempo restante com anel animado em SVG e contador numérico monoespaçado (`tabular-nums`) para evitar oscilações nos números.
* **🎨 Design Imersivo & Glassmorphism:**
  * 🍅 **Foco (Pomodoro):** Gradiente coral/terracota revigorante.
  * 🌿 **Pausa Curta:** Tons suaves de turquesa/menta para relaxamento.
  * 🌊 **Pausa Longa:** Tons calmos de azul índigo para descanso profundo.
  * Efeito de vidro fosco (*backdrop-filter blur*) e micro-interações táteis.
* **🔔 Alarme Harmônico Zen (Web Audio API):** Gera acordes harmônicos suaves via síntese nativa de áudio, sem consumir dados com arquivos de áudio externos.
* **📬 Notificações do Navegador:** Alertas na área de trabalho e celular quando um ciclo de foco ou pausa é finalizado.
* **📝 Gerenciador de Tarefas Integrado (To-Do):**
  * Crie tarefas com estimativa de ciclos de pomodoros (ex.: 2 🍅).
  * Selecione a tarefa atual para ser o **Foco Ativo** da sessão.
  * A contagem de pomodoros da tarefa é incrementada automaticamente ao concluir os ciclos.
* **⚙️ Configurações Customizáveis:**
  * Altere a duração do Pomodoro, Pausa Curta e Pausa Longa.
  * Ajuste o intervalo de ciclos para a pausa longa (padrão: 4).
  * Habilite ou desabilite início automático de intervalos e pomodoros.
  * Controle o volume do alarme ou silencie com 1 clique.
  * Todas as opções e tarefas são salvas no `localStorage`.
* **⌨️ Atalhos de Teclado Produtivos:**
  * <kbd>Espaço</kbd>: Iniciar / Pausar
  * <kbd>R</kbd>: Reiniciar o cronômetro atual
  * <kbd>S</kbd>: Pular para a próxima etapa (*Skip*)
  * <kbd>Esc</kbd>: Fechar modal de configurações

---

## 📲 Como Instalar como PWA (Celular e PC)

### 💻 No Computador (Google Chrome / Microsoft Edge / Brave / Opera)
1. Abra o site no navegador.
2. Clique no ícone de **Instalar** (ícone de download com seta) que aparecerá no canto superior direito do aplicativo ou na barra de endereços do navegador.
3. Confirme em **"Instalar"**.
4. O Pomodoro Focus será adicionado como um aplicativo desktop independente, com janela própria e atalho no Menu Iniciar / Área de Trabalho.

### 📱 No Celular Android (Google Chrome / Samsung Internet)
1. Acesse o site pelo navegador no celular.
2. Toque no botão de instalação que surge no topo do app ou no menu do navegador (**três pontinhos ⋮**).
3. Selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
4. O app será instalado no seu aparelho e funcionará em tela cheia como um aplicativo nativo.

### 🍏 No iPhone / iPad (Apple Safari)
1. Abra o aplicativo no **Safari**.
2. Toque no botão de **Compartilhar** (ícone com quadrado e seta para cima).
3. Role a lista e selecione **"Adicionar à Tela de Início"**.
4. Toque em **"Adicionar"**. O ícone oficial aparecerá na sua tela de aplicativos.

---

## 🚀 Como Executar Localmente

Como o projeto é construído em Vanilla JavaScript puro, você tem duas formas fáceis de rodar:

### Opção 1: Abertura Direta
Dê um duplo clique no arquivo [`index.html`](file:///e:/Git/pomodoro/index.html) para abrir no seu navegador padrão.

### Opção 2: Servidor Local (Recomendado para testar Service Worker / PWA)
Para testar o Service Worker e recursos de PWA localmente, sirva os arquivos através de um servidor HTTP local:

```bash
# Usando Node.js (npx)
npx serve .

# Ou usando Python (se instalado)
python -m http.server 8080
```
Depois acesse `http://localhost:8080` ou a porta indicada.

---

## 📂 Estrutura de Arquivos

```text
pomodoro/
├── css/
│   └── style.css            # Folha de estilos moderna com variáveis CSS e temas
├── icons/
│   ├── icon-192.png         # Ícone PWA (192x192)
│   └── icon-512.png         # Ícone PWA (512x512)
├── js/
│   └── script.js            # Aplicação modular (Timer, Áudio, Tarefas, PWA)
├── index.html               # Estrutura HTML semântica com anel SVG e modal
├── manifest.json            # Manifesto do Web App para instalação PWA
├── sw.js                    # Service Worker com estratégia de cache offline
└── README.md                # Documentação completa do projeto
```

---

## 🛠️ Tecnologias Utilizadas

* **HTML5:** Semântica moderna, acessibilidade e tags de viewport/PWA.
* **CSS3:** Custom Properties (Variáveis), Flexbox, Grid, Glassmorphism (`backdrop-filter`) e animações fluidas.
* **JavaScript (ES6+):** Código nativo sem frameworks pesados, arquitetura orientada a serviços e manipulação reativa do DOM.
* **Web Audio API:** Sintetizador de áudio procedural para alarmes sem uso de arquivos de mídia externos.
* **Service Workers & Web App Manifest:** Capacidades offline, controle de cache e instalabilidade multiplataforma.
* **Web Storage API (`localStorage`):** Persistência instantânea de preferências, estatísticas e tarefas.

---

## 📄 Licença

Este projeto está sob a licença [MIT](https://opensource.org/licenses/MIT). Sinta-se livre para usar, estudar e customizar!
