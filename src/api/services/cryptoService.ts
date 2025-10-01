import crypto from "crypto";


class CryptoService {
    private readonly algorithm = "aes-256-cbc";

    encrypt(text: string, key: string, iv: string): string {
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key), Buffer.from(iv));
        let encrypted = cipher.update(text, "utf8");
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString("hex");
    }

    decrypt(encryptedText: string, key: string, iv: string): string {
        const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(key), Buffer.from(iv));
        let decrypted = decipher.update(Buffer.from(encryptedText, "hex"));
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString("utf8");
    }

    generateKey(): string {
        return crypto.randomBytes(32).toString("hex").slice(0, 32);
    }

    generateIV(): string {
        return crypto.randomBytes(16).toString("hex").slice(0, 16);
    }

    encryptCombinedValue(token: string, slug: string, key:any, iv:any): { encryptedText: string; } {
        const combinedValue = `${token}:${slug}`;
        const encryptedText = this.encrypt(combinedValue, key, iv);
        return {encryptedText};
    }

    decryptCombinedValue(encryptedText: string, key: any, iv: any): { token: string; slug: string } {
        const decryptedValue = this.decrypt(encryptedText, key, iv);
        const [token, slug] = decryptedValue.split(":");
        return { token, slug };
    }
}

export const cryptoService = new CryptoService();
