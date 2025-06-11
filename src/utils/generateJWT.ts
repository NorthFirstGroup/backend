import jwt, { SignOptions } from 'jsonwebtoken';

/** 建立 JSON Web Token（JWT
 * @param payload - 要加密的資料內容
 * @param secret - 用來簽章的密鑰字串
 * @param options - JWT 簽章選項，對應 jsonwebtoken 套件的 SignOptions
 * @returns 回傳一個 JWT 字串
 */
export default function createJwtToken(
    payload: string | object | Buffer,
    secret: string,
    options: SignOptions = {}
): Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, secret, options, (err, token) => {
            if (err || !token) {
                reject(err);
                return;
            }
            resolve(token);
        });
    });
}
