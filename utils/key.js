import { rejects } from 'assert';
import * as crypto from 'crypto';
import constants  from './constants.js'

let aesSalt = 'a5782e4ff88d33106913bd15965d776955e76a1d511359d0f76b89dcbf8ea721fc32f0cf3a3a19c932e44872c141e7d63e8f07aea7da023a38273e6dd1d5b667';

export function kdf(password, salt) {
    // console.log(password, salt)
    // console.log(constants)
    const key = crypto.pbkdf2Sync(password, salt, 10000, constants.aesKeySize, constants.sha256);
    return key;
}

export function keyGen(password) {
    if (!password) {
      throw Error("No Password");
    }
    //console.log(aesSalt.toString('hex'));
    const key = kdf(password, aesSalt.toString('hex'));
    return key;
}

/*
export function aes256Encrypt(data, key) {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(aes256Gcm, key, iv);
        let enc = cipher.update(data, 'utf8', 'base64');
        enc += cipher.final('base64');
        return [enc, iv, cipher.getAuthTag()];
    } catch (error) {
        message.error(error);
    }
    return null;
}
*/
export async function aes256Decrypt(data, key, ivStr, authTagStr) {
    let Verbose = false;
    return new Promise((resolve, rejects)=> {
        try {
            const iv = Buffer.from(ivStr, 'hex');
            if (Verbose) console.log("iv:", iv)
            const authTag = Buffer.from(authTagStr, 'hex');
            if (Verbose) console.log("authTag:", authTag)
            const decipher = crypto.createDecipheriv(constants.aes256Gcm, key, iv);
            if (Verbose) console.log("decipher:", decipher)
            decipher.setAuthTag(authTag)
            let str = decipher.update(data, 'base64', 'utf8');
            if (Verbose) console.log("decipher.update:", str)
            str += decipher.final('utf8');
            resolve(str);
        } catch (error) {
            resolve(false)
        }
    })
}