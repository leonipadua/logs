import "server-only";
import { randomBytes } from "node:crypto";

const SENHAS_COMUNS = new Set([
  "123456789012",
  "senha123456",
  "password1234",
  "12345678901234",
  "qwertyuiop12",
  "administrador",
]);

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

/** Senha temporária de convite: aleatória, criptográfica, >= 12 caracteres. */
export function gerarSenhaTemporaria(tamanho = 14): string {
  const bytes = randomBytes(tamanho);
  let senha = "";
  for (let i = 0; i < tamanho; i++) {
    senha += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return senha;
}

/** Política: mínimo 10 caracteres, sem exigência de símbolo/maiúscula. */
export function validarPoliticaSenha(senha: string): string | null {
  if (senha.length < 10) return "A senha precisa de pelo menos 10 caracteres.";
  if (SENHAS_COMUNS.has(senha.toLowerCase())) {
    return "Essa senha é comum demais. Escolha outra.";
  }
  return null;
}
