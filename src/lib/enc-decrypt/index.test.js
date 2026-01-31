// Import the module under test
import * as moduleExports from "./index";

// Importing all the services for testing

describe("Module Exports", () => {
  it("should export all the services", () => {
    expect(moduleExports.encrypt).toBeTruthy();
  });
  it("should export all the services", () => {
    expect(moduleExports.decrypt).toBeTruthy();
  });
});
