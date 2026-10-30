import bcrypt from "bcryptjs";

// Las contraseñas se guardan siempre con hash bcrypt, nunca en claro.
export function encriptarClave(clave: string): Promise<string> {
  const rondas = 10;
  return bcrypt.hash(clave, rondas);
}

export function compararClave(clave: string, hash: string): Promise<boolean> {
  return bcrypt.compare(clave, hash);
}
