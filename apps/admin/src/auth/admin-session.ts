const STORAGE_KEY = "baruk-admin-key";

/**
 * Guarda a chave administrativa só durante a sessão do navegador (some ao
 * fechar a aba). Único lugar do app que sabe onde a chave fica.
 */
export const adminSession = {
  getKey: (): string | null => sessionStorage.getItem(STORAGE_KEY),
  save: (key: string) => sessionStorage.setItem(STORAGE_KEY, key),
  clear: () => sessionStorage.removeItem(STORAGE_KEY),
};
