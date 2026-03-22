import {
  generateKeyPair,
  exportJWK,
  importJWK,
  compactDecrypt,
  CompactEncrypt,
} from "jose";
import { Redis } from "ioredis";

// Initialize Redis client
const redis = new Redis();

type PrivateKeyType = Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];

class CryptoService {
  private serverPrivateKey!: PrivateKeyType;
  public serverPublicKeyJwk: any;

  async init() {
    if (this.serverPrivateKey) return;
    const { publicKey, privateKey } = await generateKeyPair("ECDH-ES+A256KW", {
      crv: "P-256",
    });
    this.serverPrivateKey = privateKey;
    this.serverPublicKeyJwk = await exportJWK(publicKey);
  }

  // Store client public key in Redis with a 1-hour expiration
  async saveClientKey(clientId: string, clientKey: any): Promise<void> {
    await redis.set(
      `client_key:${clientId}`,
      JSON.stringify(clientKey),
      "EX",
      3600,
    );
  }

  // Retrieve client public key from Redis
  async getClientKey(clientId: string): Promise<any> {
    const data = await redis.get(`client_key:${clientId}`);
    return data ? JSON.parse(data) : null;
  }

  async decrypt(jwe: string): Promise<any> {
    if (!this.serverPrivateKey)
      throw new Error("CryptoService not initialized");
    const { plaintext } = await compactDecrypt(jwe, this.serverPrivateKey);
    return JSON.parse(new TextDecoder().decode(plaintext));
  }

  async encrypt(payload: any, clientPublicKeyJwk: any): Promise<string> {
    const clientKey = await importJWK(clientPublicKeyJwk, "ECDH-ES+A256KW");
    const jwe = await new CompactEncrypt(
      new TextEncoder().encode(JSON.stringify(payload)),
    )
      .setProtectedHeader({ alg: "ECDH-ES+A256KW", enc: "A256GCM" })
      .encrypt(clientKey);
    return jwe;
  }
}

export default new CryptoService();
