/**
 * Configuração de Persistência Híbrida (Firebase Firestore + LocalStorage Fallback)
 * Pesquisa Trabalho de Matemática — Super Herói
 *
 * Caso deseje ativar o banco de dados em nuvem do Firebase, basta preencher
 * os dados do seu projeto em FIREBASE_PROJECT_CONFIG abaixo (ou pelo painel
 * de conexão rápida da página). Sem chaves preenchidas, o site funciona 100%
 * instantaneamente salvando os dados localmente no navegador.
 */

export const FIREBASE_PROJECT_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const STORAGE_KEY_ENTRIES = "mat_super_heroi_pesquisa_v1";
const STORAGE_KEY_EXIT_ATTEMPTS = "mat_super_heroi_primos_bloqueios_v1";
const STORAGE_KEY_CUSTOM_FB = "mat_super_heroi_firebase_config_v1";

const DEFAULT_HERO_DATA = [
  {
    id: "seed-1",
    heroi: "Homem-Aranha (Peter Parker)",
    equacao: "F = m · v² / r (Pêndulo Centrípeto)",
    primoChave: 13,
    createdAt: "Registro Inicial"
  },
  {
    id: "seed-2",
    heroi: "Homem de Ferro (Tony Stark)",
    equacao: "E = ∫ P(t) dt (Reator Arc Matriz Prima)",
    primoChave: 17,
    createdAt: "Registro Inicial"
  },
  {
    id: "seed-3",
    heroi: "Flash (Barry Allen)",
    equacao: "γ = 1 / √(1 - v²/c²) (Fator de Lorentz)",
    primoChave: 23,
    createdAt: "Registro Inicial"
  }
];

export function getActiveFirebaseConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_FB);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Aviso ao ler configuração local do Firebase:", err);
  }
  if (FIREBASE_PROJECT_CONFIG.projectId && FIREBASE_PROJECT_CONFIG.apiKey) {
    return FIREBASE_PROJECT_CONFIG;
  }
  return null;
}

export function saveCustomFirebaseConfig(configObj) {
  localStorage.setItem(STORAGE_KEY_CUSTOM_FB, JSON.stringify(configObj));
}

export function loadResearchEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTRIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(DEFAULT_HERO_DATA));
      return [...DEFAULT_HERO_DATA];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_HERO_DATA];
  } catch {
    return [...DEFAULT_HERO_DATA];
  }
}

export function addResearchEntry(entry) {
  const current = loadResearchEntries();
  const newRecord = {
    id: `hero-${Date.now()}`,
    heroi: entry.heroi,
    equacao: entry.equacao,
    primoChave: Number(entry.primoChave),
    createdAt: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
  const updated = [newRecord, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(updated));
  } catch (err) {
    console.warn("Aviso ao salvar registro:", err);
  }
  return updated;
}

export function getBlockedExitCount() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY_EXIT_ATTEMPTS) || "0");
  } catch {
    return 0;
  }
}

export function incrementBlockedExitCount() {
  const next = getBlockedExitCount() + 1;
  try {
    localStorage.setItem(STORAGE_KEY_EXIT_ATTEMPTS, String(next));
  } catch {
    // ignore storage errors
  }
  return next;
}
