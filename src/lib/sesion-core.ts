import { SignJWT, jwtVerify } from "jose";

// Núcleo de la sesión (firmar/leer el token). Vive separado de
// session.ts para que el proxy también pueda leer la cookie
// sin cargar código exclusivo del servidor de páginas.

const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error("Falta SESSION_SECRET en el .env (mira .env.example)");
}
const encodedKey = new TextEncoder().encode(secret);

export type SesionPayload = {
  userId: number;
  rol: string;
};

export async function encrypt(payload: SesionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(
  token: string | undefined = ""
): Promise<SesionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SesionPayload;
  } catch {
    return null;
  }
}
