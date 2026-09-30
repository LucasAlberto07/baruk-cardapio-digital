/** Único ponto que lê variáveis VITE_*; o resto do app importa daqui. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER ?? "5500000000000",
};
