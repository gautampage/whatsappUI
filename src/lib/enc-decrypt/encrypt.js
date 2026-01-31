import CryptoJS from "crypto-js";
import { generateInitVectorByCustId, generateKeyByCustId } from "./init";

/**
 * Encryption function: AES encryption for APIs uses `customerId` to generate unique `key` and `initVector`
 * @param {*} customerId - Customer Id to generate the `secretKey` and `initializationVector`
 * @param {*} objectToEncrypt - Object to to encrypt with the AES encryption with `secretKey` and `initializationVector`
 * @returns - Encrypted String of JSON stringified Object
 */
export const encrypt = (customerId, objectToEncrypt) => {
  const originalStringifiedObject = JSON.stringify(objectToEncrypt);
  const utf8ParsedKey = CryptoJS.enc.Utf8.parse(
    generateKeyByCustId(customerId)
  );
  const utf8ParsedInitVector = CryptoJS.enc.Utf8.parse(
    generateInitVectorByCustId(customerId)
  );
  let encryptedObject = CryptoJS.AES.encrypt(
    JSON.stringify(objectToEncrypt),
    utf8ParsedKey,
    {
      iv: utf8ParsedInitVector,
      mode: CryptoJS.mode.CBC,
    }
  );
  const encryptedStringBase64 = encryptedObject.ciphertext.toString(
    CryptoJS.enc.Base64
  );
  return encryptedStringBase64;
};
