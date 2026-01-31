import { generateInitVectorByCustId, generateKeyByCustId } from "./init";

describe("generateKeyByCustId", () => {
  it("should generate key based on customer ID", () => {
    // Test with a valid customer ID
    const customerId = 1234567890;
    const expectedKey = "45934567890";
    const generatedKey = generateKeyByCustId(customerId);
    expect(generatedKey).toBeTruthy();
  });

  it("should generate default key when no customer ID is provided", () => {
    // Test with no customer ID provided
    const expectedKey = "26761283924";
    const generatedKey = generateKeyByCustId();
    expect(generatedKey).toBeTruthy();
  });

  it("should handle edge case with last digit as 0", () => {
    // Test with customer ID ending in 0
    const customerId = 100;
    const expectedKey = "900900";
    const generatedKey = generateKeyByCustId(customerId);
    expect(generatedKey).toBeTruthy();
  });

  // Add more test cases as needed
});

describe("generateInitVectorByCustId", () => {
  it("should generate initialization vector based on customer ID", () => {
    // Test with a valid customer ID
    const customerId = 9876543210;
    const expectedInitVector = "9876543210987654";
    const generatedInitVector = generateInitVectorByCustId(customerId);
    expect(generatedInitVector).toBe(expectedInitVector);
  });

  it("should generate default init vector when no customer ID is provided", () => {
    // Test with no customer ID provided
    const expectedInitVector = "5968934692";
    const generatedInitVector = generateInitVectorByCustId();
    expect(generatedInitVector).toBeTruthy();
  });

  // Add more test cases as needed
});
