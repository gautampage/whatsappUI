import CryptoJS from "crypto-js";
import { decrypt } from "./decrypt";
import { generateInitVectorByCustId, generateKeyByCustId } from "./init";

// Mocking generateKeyByCustId and generateInitVectorByCustId functions
jest.mock("./init", () => ({
  generateKeyByCustId: jest.fn(),
  generateInitVectorByCustId: jest.fn(),
}));

describe("decrypt function", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error if decryption fails", () => {
    // Mocking generateKeyByCustId and generateInitVectorByCustId functions
    generateKeyByCustId.mockReturnValue("mocked-key");
    generateInitVectorByCustId.mockReturnValue("mocked-iv");

    // Mock encrypted string
    const encryptedString = "InvalidEncryptedString";

    // Mock AES.decrypt method of CryptoJS to throw an error
    jest.spyOn(CryptoJS.AES, "decrypt").mockImplementation(() => {
      throw new Error("Decryption failed");
    });

    // Assertions
    expect(() => decrypt("customer123", encryptedString)).toThrow(
      "Decryption failed"
    );
  });
});
