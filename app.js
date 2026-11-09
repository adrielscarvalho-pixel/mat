import {
  loadResearchEntries,
  addResearchEntry,
  getBlockedExitCount,
  incrementBlockedExitCount,
  getActiveFirebaseConfig
} from "./firebase-config.js";

const EXIT_LOCK_DURATION_MS = 5000;

// Elementos da Tela Inicial e Navegação
const screenInicio = document.getElementById("screen-inicio");
const screenPesquisa = document.getElementById("screen-pesquisa");
const btnIniciar = document.getElementById("btn-iniciar");
const btnSair = document.getElementById("btn-sair");
const btnVoltarInicio = document.getElementById("btn-voltar-inicio");
const brandHomeLink = document.getElementById("brand-home-link");
const exitAttemptsCounter = document.getElementById("exit-attempts-counter");
const firebaseStatusText = document.getElementById("firebase-status-text");

// Elementos do Overlay de 5 Segundos ("OS PRIMOS NÃO DEIXARÃO!")
const primosOverlay = document.getElementById("primos-alert-overlay");
const primosTimerBar = document.getElementById("primos-timer-bar");
const primosTimerCountdown = document.getElementById("primos-timer-countdown");

// Elementos da Página 2 (Pesquisa & Verificador de Primos)
const inputPrimeNumber = document.getElementById("input-prime-number");
const primeResultHeadline = document.getElementById("prime-result-headline");
const primeResultExplanation = document.getElementById("prime-result-explanation");
const formAddHero = document.getElementById("form-add-hero");
const inputHeroName = document.getElementById("input-hero-name");
const inputHeroFormula = document.getElementById("input-hero-formula");
const researchEntriesList = document.getElementById("research-entries-list");

let activeExitTimeoutId = null;
let activeAnimationFrameId = null;

/**
 * Emite um pulso sonoro sintetizado via Web Audio API quando o usuário tenta clicar em "Sair"
 */
function playPrimeGuardianTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Frequências baseadas em proporções de números primos (220Hz, 330Hz, 550Hz)
    [220, 277.18, 330].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.58);
    });
  } catch {
    // Ignorar caso o navegador bloqueie áudio sem interação prévia
  }
}

/**
 * Alterna entre a Tela Inicial ('inicio') e a Segunda Página ('pesquisa')
 */
function navigateToScreen(targetScreen, updateHash = true) {
  if (targetScreen === "pesquisa") {
    screenInicio.hidden = true;
    screenPesquisa.hidden = false;
    screenPesquisa.classList.remove("screen-entering");
    void screenPesquisa.offsetWidth;
    screenPesquisa.classList.add("screen-entering");
    if (updateHash && window.location.hash !== "#pesquisa") {
      history.pushState({ screen: "pesquisa" }, "", "#pesquisa");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    screenPesquisa.hidden = true;
    screenInicio.hidden = false;
    screenInicio.classList.remove("screen-entering");
    void screenInicio.offsetWidth;
    screenInicio.classList.add("screen-entering");
    if (updateHash && window.location.hash === "#pesquisa") {
      history.pushState({ screen: "inicio" }, "", "#inicio");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

/**
 * Exibe a mensagem "OS PRIMOS NÃO DEIXARÃO!" por exatos 5 segundos (5000ms)
 */
function triggerPrimosExitLock() {
  if (activeExitTimeoutId) {
    clearTimeout(activeExitTimeoutId);
  }
  if (activeAnimationFrameId) {
    cancelAnimationFrame(activeAnimationFrameId);
  }

  playPrimeGuardianTone();

  const totalBlocked = incrementBlockedExitCount();
  updateExitCounterDisplay(totalBlocked);

  primosOverlay.classList.add("is-active");
  primosOverlay.setAttribute("aria-hidden", "false");

  const startTime = performance.now();

  function updateCountdownFrame(now) {
    const elapsed = now - startTime;
    const remainingMs = Math.max(0, EXIT_LOCK_DURATION_MS - elapsed);
    const ratio = remainingMs / EXIT_LOCK_DURATION_MS;

    primosTimerBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    primosTimerCountdown.textContent = `Retornando à missão em ${(remainingMs / 1000).toFixed(1)}s...`;

    if (remainingMs > 0) {
      activeAnimationFrameId = requestAnimationFrame(updateCountdownFrame);
    }
  }

  activeAnimationFrameId = requestAnimationFrame(updateCountdownFrame);

  activeExitTimeoutId = setTimeout(() => {
    primosOverlay.classList.remove("is-active");
    primosOverlay.setAttribute("aria-hidden", "true");
    activeExitTimeoutId = null;
  }, EXIT_LOCK_DURATION_MS);
}

function updateExitCounterDisplay(count) {
  if (!exitAttemptsCounter) return;
  exitAttemptsCounter.textContent =
    count === 1 ? "1 bloqueio" : `${count} bloqueios`;
}

/**
 * Verifica se um número é primo e retorna sua fatoração caso seja composto
 */
function analyzePrimeNumber(n) {
  if (!Number.isInteger(n) || n < 2) {
    return {
      isPrime: false,
      headline: `${n || 0} não é um Número Primo`,
      detail: "Números primos são inteiros maiores que 1 que possuem apenas dois divisores: 1 e ele mesmo (ex: 2, 3, 5, 7, 11...)."
    };
  }

  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) {
      const factors = factorizeNumber(n);
      return {
        isPrime: false,
        headline: `${n} é um Número Composto`,
        detail: `Divisível por ${i}. Fatoração em primos: ${n} = ${factors.join(" × ")}.`
      };
    }
  }

  return {
    isPrime: true,
    headline: `${n} é um Número Primo Super-Herói!`,
    detail: `Indestrutível! Divisível apenas por 1 e por ${n}. Faz parte da guarda que não deixa ninguém sair!`
  };
}

function factorizeNumber(num) {
  const factors = [];
  let d = 2;
  let temp = num;
  while (d * d <= temp) {
    while (temp % d === 0) {
      factors.push(d);
      temp = Math.floor(temp / d);
    }
    d++;
  }
  if (temp > 1) {
    factors.push(temp);
  }
  return factors;
}

function renderPrimeAnalysis() {
  const rawVal = parseInt(inputPrimeNumber.value, 10);
  const result = analyzePrimeNumber(rawVal);
  primeResultHeadline.textContent = result.headline;
  primeResultHeadline.style.color = result.isPrime
    ? "var(--gold-400)"
    : "var(--crimson-400)";
  primeResultExplanation.textContent = result.detail;
}

function renderResearchEntries() {
  const entries = loadResearchEntries();
  researchEntriesList.innerHTML = "";

  entries.forEach((item) => {
    const row = document.createElement("div");
    row.className = "submission-item";

    const left = document.createElement("div");
    const title = document.createElement("div");
    title.className = "submission-hero";
    title.textContent = item.heroi;

    const eq = document.createElement("div");
    eq.style.fontSize = "0.82rem";
    eq.style.color = "var(--text-secondary)";
    eq.textContent = item.equacao;

    left.appendChild(title);
    left.appendChild(eq);

    const right = document.createElement("div");
    right.className = "submission-meta";
    right.textContent = `Primo #${item.primoChave || 13}`;

    row.appendChild(left);
    row.appendChild(right);
    researchEntriesList.appendChild(row);
  });
}

// Inicialização de Eventos
function initApp() {
  updateExitCounterDisplay(getBlockedExitCount());
  renderResearchEntries();
  renderPrimeAnalysis();

  const fbConfig = getActiveFirebaseConfig();
  if (fbConfig && firebaseStatusText) {
    firebaseStatusText.textContent = `Firebase Conectado (${fbConfig.projectId})`;
  }

  // Clique em INICIAR -> Vai para a outra página
  btnIniciar.addEventListener("click", () => {
    navigateToScreen("pesquisa");
  });

  // Clique em SAIR -> Exibe por 5 segundos: "OS PRIMOS NÃO DEIXARÃO!"
  btnSair.addEventListener("click", () => {
    triggerPrimosExitLock();
  });

  // Voltar para a tela inicial
  btnVoltarInicio.addEventListener("click", () => {
    navigateToScreen("inicio");
  });

  brandHomeLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigateToScreen("inicio");
  });

  // Atualização em tempo real do verificador de números primos
  inputPrimeNumber.addEventListener("input", renderPrimeAnalysis);

  // Registro de novo Super-Herói na pesquisa
  formAddHero.addEventListener("submit", (e) => {
    e.preventDefault();
    const heroi = inputHeroName.value.trim();
    const equacao = inputHeroFormula.value.trim();
    if (!heroi || !equacao) return;

    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
    const randomPrime = primes[Math.floor(Math.random() * primes.length)];

    addResearchEntry({
      heroi,
      equacao,
      primoChave: randomPrime
    });

    inputHeroName.value = "";
    inputHeroFormula.value = "";
    renderResearchEntries();
  });

  // Suporte a navegação por hash (#pesquisa / #inicio)
  window.addEventListener("popstate", () => {
    if (window.location.hash === "#pesquisa") {
      navigateToScreen("pesquisa", false);
    } else {
      navigateToScreen("inicio", false);
    }
  });

  if (window.location.hash === "#pesquisa") {
    navigateToScreen("pesquisa", false);
  }
}

document.addEventListener("DOMContentLoaded", initApp);
