import CryptoJS from "crypto-js";
import { encrypt } from "./encrypt";
import { generateInitVectorByCustId, generateKeyByCustId } from "./init";

// Mocking generateKeyByCustId and generateInitVectorByCustId functions
jest.mock("./init", () => ({
  generateKeyByCustId: jest.fn(),
  generateInitVectorByCustId: jest.fn(),
}));

describe("encrypt function", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error if encryption fails", () => {
    // Mocking generateKeyByCustId and generateInitVectorByCustId functions
    generateKeyByCustId.mockReturnValue("mocked-key");
    generateInitVectorByCustId.mockReturnValue("mocked-iv");

    // Mock object to encrypt
    const objectToEncrypt = { message: "Encrypt this message" };

    // Mock AES.encrypt method of CryptoJS to throw an error
    jest.spyOn(CryptoJS.AES, "encrypt").mockImplementation(() => {
      throw new Error("Encryption failed");
    });

    // Assertions
    expect(() => encrypt("customer123", objectToEncrypt)).toThrow(
      "Encryption failed"
    );
  });
});
