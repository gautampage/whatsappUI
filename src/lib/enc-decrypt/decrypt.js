import CryptoJS from "crypto-js";
import { generateInitVectorByCustId, generateKeyByCustId } from "./init";

/**
 * Decryption Function: AES decryption for APIs uses `customerId` to generate unique `key` and `initVector`
 * @param {*} customerId - Customer Id to generate the `secretKey` and `initializationVector`
 * @param {*} encryptedString - encrypted string coming from API
 * @returns - JSON Parsed AES decrypted Object
 */
export const decrypt = (
  customerId,
  encryptedString,
  isStringOutput = false
) => {
  const utf8ParsedKey = CryptoJS.enc.Utf8.parse(
    generateKeyByCustId(customerId)
  );
  const utf8ParsedInitVector = CryptoJS.enc.Utf8.parse(
    generateInitVectorByCustId(customerId)
  );
  const decryptedStringBase64 = CryptoJS.AES.decrypt(
    encryptedString,
    utf8ParsedKey,
    {
      iv: utf8ParsedInitVector,
      mode: CryptoJS.mode.CBC,
    }
  ).toString(CryptoJS.enc.Utf8);

  if (isStringOutput) return decryptedStringBase64;
  return JSON.parse(decryptedStringBase64);
};
