export interface FormState {
  errors?: Record<string, string>;
  message?: string;
  success?: boolean;
  /** Usado só pelo checkout de desbloqueio (Pix). */
  pix?: { payload: string; qrcodeBase64: string } | null;
}

export const INITIAL_FORM_STATE: FormState = {};
