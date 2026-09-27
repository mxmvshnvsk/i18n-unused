import {
  buildKeyCandidates,
  isDynamicKeyUsage,
} from "../../src/helpers/keyCandidates";

describe("keyCandidates helper", () => {
  describe("buildKeyCandidates", () => {
    it("generates candidates with namespace and keyPrefix", () => {
      const candidates = buildKeyCandidates("submit", "login", ["auth"]);
      expect(candidates).toEqual([
        "auth.login.submit",
        "login.submit",
        "submit",
      ]);
    });

    it("generates candidates with multiple namespaces", () => {
      const candidates = buildKeyCandidates("save", "buttons", [
        "common",
        "auth",
      ]);
      expect(candidates).toEqual([
        "common.buttons.save",
        "auth.buttons.save",
        "buttons.save",
        "save",
      ]);
    });

    it("generates candidates with keyPrefix only (no namespace)", () => {
      const candidates = buildKeyCandidates("title", "header");
      expect(candidates).toEqual(["header.title", "title"]);
    });

    it("generates candidates with namespace only (no keyPrefix)", () => {
      const candidates = buildKeyCandidates("submit", undefined, ["auth"]);
      expect(candidates).toEqual(["auth.submit", "submit"]);
    });

    it("handles empty or falsy namespace elements gracefully", () => {
      const candidates = buildKeyCandidates("save", "buttons", ["", "auth"]);
      expect(candidates).toEqual(["auth.buttons.save", "buttons.save", "save"]);
    });

    it("handles namespace without keyPrefix having empty elements", () => {
      const candidates = buildKeyCandidates("save", undefined, ["", "auth"]);
      expect(candidates).toEqual(["auth.save", "save"]);
    });

    it("handles undefined keyPrefix and empty namespaces list", () => {
      const candidates = buildKeyCandidates("rawKey", undefined, []);
      expect(candidates).toEqual(["rawKey"]);
    });

    it("generates candidates for inline colon-separated namespaces (e.g. file:my.translation.key)", () => {
      const candidates = buildKeyCandidates("file:my.translation.key");
      expect(candidates).toEqual([
        "file.my.translation.key",
        "my.translation.key",
        "file:my.translation.key",
      ]);
    });

    it("generates candidates for inline colon-separated namespaces with keyPrefix", () => {
      const candidates = buildKeyCandidates("auth:submit", "login");
      expect(candidates).toEqual([
        "auth.login.submit",
        "auth.submit",
        "login.submit",
        "submit",
        "login.auth:submit",
        "auth:submit",
      ]);
    });
  });

  describe("isDynamicKeyUsage", () => {
    it("detects dynamic interpolation in raw key", () => {
      expect(isDynamicKeyUsage("items.${id}", "login", ["auth"])).toBe(true);
    });

    it("detects dynamic interpolation in keyPrefix", () => {
      expect(isDynamicKeyUsage("submit", "items.${category}", ["auth"])).toBe(
        true,
      );
    });

    it("detects dynamic interpolation in namespace", () => {
      expect(isDynamicKeyUsage("submit", "login", ["auth.${section}"])).toBe(
        true,
      );
    });

    it("returns false for static keys", () => {
      expect(isDynamicKeyUsage("submit", "login", ["auth"])).toBe(false);
    });
  });
});
