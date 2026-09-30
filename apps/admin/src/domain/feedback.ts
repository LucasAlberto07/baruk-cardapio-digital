/** Mensagem exibida ao lojista depois de uma ação. */
export type Feedback = { kind: "success" | "error"; text: string };

export const success = (text: string): Feedback => ({ kind: "success", text });
export const failure = (text: string): Feedback => ({ kind: "error", text });
