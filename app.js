import {
  loadResearchEntries,
  addResearchEntry,
  getBlockedExitCount,
  incrementBlockedExitCount,
  getActiveFirebaseConfig
} from "./firebase-config.js";

const EXIT_LOCK_DURATION_MS = 5000;
const MATH_SCRAMBLE_GLYPHS = ["2", "3", "5", "7", "11", "13", "π", "φ", "∑", "√"];

// Elementos da Tela Inicial e Navegação
const screenInicio = document.getElementById("screen-inicio");
const screenPesquisa = document.getElementById("screen-pesquisa");
const titleLineTop = document.getElementById("title-line-top");
const titleLineBottom = document.getElementById("title-line-bottom");
const heroMainHeading = document.getElementById("hero-main-heading");
const stageHeading = document.getElementById("stage-heading");
const btnIniciar = document.getElementById("btn-iniciar");
const btnSair = document.getElementById("btn-sair");
const btnVoltarInicio = document.getElementById("btn-voltar-inicio");
const brandHomeLink = document.getElementById("brand-home-link");
const exitAttemptsCounter = document.getElementById("exit-attempts-counter");
const firebaseStatusText = document.getElementById("firebase-status-text");

// Elementos do Overlay de 5 Segundos ("OS PRIMOS NÃO DEIXARÃO!")
const primosOverlay = document.getElementById("primos-alert-overlay");
const primosAlertTitle = document.getElementById("primos-alert-title");
const floatingPrimesStage = document.getElementById("floating-primes-stage");
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
 * Transforma o texto de um elemento em letras individuais animadas (Kinetic Typography)
 * que se mexem ao aparecer (pulo 3D + decodificação matemática + onda viva contínua).
 */
function animateKineticText(element, options = {}) {
  if (!element) return 0;

  const {
    charClass = "kinetic-char",
    startIndex = 0,
    scramble = true
  } = options;

  const rawText = element.getAttribute("data-text") || element.textContent.trim();
  element.setAttribute("data-text", rawText);
  element.setAttribute("aria-label", rawText);
  element.innerHTML = "";

  const words = rawText.split(" ");
  let charGlobalIndex = startIndex;

  words.forEach((word, wordIdx) => {
    const wordSpan = document.createElement("span");
    wordSpan.className = "kinetic-word";
    wordSpan.setAttribute("aria-hidden", "true");

    Array.from(word).forEach((letter) => {
      const charSpan = document.createElement("span");
      charSpan.className = charClass;
      const currentIdx = charGlobalIndex++;
      charSpan.style.setProperty("--char-index", String(currentIdx));
      charSpan.textContent = letter;

      if (scramble) {
        const delayMs = currentIdx * 38;
        setTimeout(() => {
          charSpan.classList.add("is-scrambling");
          let ticks = 0;
          const scrambleInterval = setInterval(() => {
            ticks++;
            if (ticks >= 4) {
              clearInterval(scrambleInterval);
              charSpan.textContent = letter;
              charSpan.classList.remove("is-scrambling");
            } else {
              charSpan.textContent =
                MATH_SCRAMBLE_GLYPHS[
                  Math.floor(Math.random() * MATH_SCRAMBLE_GLYPHS.length)
                ];
            }
          }, 45);
        }, delayMs);
      }

      wordSpan.appendChild(charSpan);
    });

    element.appendChild(wordSpan);

    if (wordIdx < words.length - 1) {
      const spaceSpan = document.createElement("span");
      spaceSpan.className = "kinetic-space";
      spaceSpan.setAttribute("aria-hidden", "true");
      spaceSpan.innerHTML = "&nbsp;";
      element.appendChild(spaceSpan);
    }
  });

  return charGlobalIndex;
}

/**
 * Dispara a animação das letras do título principal:
 * "Pesquisa Trabalho de Matemática" (em cima) e "Super Herói" (embaixo)
 */
function triggerMainTitleAnimation() {
  const nextIndex = animateKineticText(titleLineTop, {
    charClass: "kinetic-char",
    startIndex: 0,
    scramble: true
  });
  animateKineticText(titleLineBottom, {
    charClass: "kinetic-char",
    startIndex: nextIndex + 2,
    scramble: true
  });
}

/**
 * Cria partículas de números primos subindo ao fundo quando clica em SAIR
 */
function spawnFloatingPrimes() {
  if (!floatingPrimesStage) return;
  floatingPrimesStage.innerHTML = "";
  const primesList = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

  for (let i = 0; i < 18; i++) {
    const p = document.createElement("span");
    p.className = "floating-prime-particle";
    p.textContent = String(primesList[i % primesList.length]);
    p.style.left = `${(i * 5.6 + Math.random() * 4) % 96}%`;
    p.style.fontSize = `${1.25 + (i % 4) * 0.65}rem`;
    p.style.animationDuration = `${2.2 + (i % 5) * 0.45}s`;
    p.style.animationDelay = `${(i % 6) * 0.18}s`;
    floatingPrimesStage.appendChild(p);
  }
}

/**
 * Emite um pulso sonoro sintetizado via Web Audio API quando o usuário tenta clicar em "Sair"
 */
function playPrimeGuardianTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

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

    animateKineticText(stageHeading, {
      charClass: "kinetic-char",
      startIndex: 0,
      scramble: true
    });

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

    triggerMainTitleAnimation();

    if (updateHash && window.location.hash === "#pesquisa") {
      history.pushState({ screen: "inicio" }, "", "#inicio");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

/**
 * Exibe a mensagem "OS PRIMOS NÃO DEIXARÃO!" por exatos 5 segundos (5000ms)
 * com todas as letras saltando e vibrando!
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

  spawnFloatingPrimes();
  animateKineticText(primosAlertTitle, {
    charClass: "primos-kinetic-char",
    startIndex: 0,
    scramble: false
  });

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
  triggerMainTitleAnimation();
  updateExitCounterDisplay(getBlockedExitCount());
  renderResearchEntries();
  renderPrimeAnalysis();

  const fbConfig = getActiveFirebaseConfig();
  if (fbConfig && firebaseStatusText) {
    firebaseStatusText.textContent = `Firebase Conectado (${fbConfig.projectId})`;
  }

  // Permite clicar no título principal para repetir a animação das letras
  if (heroMainHeading) {
    heroMainHeading.addEventListener("click", () => {
      triggerMainTitleAnimation();
    });
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
