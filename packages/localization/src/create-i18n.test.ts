import { describe, expect, it } from "vitest";
import { createI18n } from "./create-i18n.js";

const resources = {
  en: { common: { greeting: "Hello" } },
  pl: { common: { greeting: "Witaj" } },
};

describe("createI18n", () => {
  it("defaults to the English source locale", () => {
    const i18n = createI18n({ resources });

    expect(i18n.language).toBe("en");
    expect(i18n.t("greeting")).toBe("Hello");
  });

  it("switches locale without needing any simulation reference", async () => {
    const i18n = createI18n({ resources });

    await i18n.changeLanguage("pl");

    expect(i18n.language).toBe("pl");
    expect(i18n.t("greeting")).toBe("Witaj");
  });

  it("falls back to the source locale for missing keys", () => {
    const i18n = createI18n({ resources, initialLocale: "pl" });

    expect(i18n.t("greeting")).toBe("Witaj");
  });
});
