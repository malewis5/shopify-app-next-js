import { describe, expect, it, vi } from "vitest";

import { getHref } from "./utils.js";

describe("getHref", () => {
  it("returns an element's literal href attribute without calling getAttribute", () => {
    const link = document.createElement("a");
    link.setAttribute("href", "/products");
    const getAttribute = vi.spyOn(link, "getAttribute");

    expect(getHref(link)).toBe("/products");
    expect(getAttribute).not.toHaveBeenCalled();
  });

  it("falls back to the href property when the attribute is absent", () => {
    const element = document.createElement("div") as HTMLDivElement & { href: string };
    element.href = "/products";

    expect(getHref(element)).toBe("/products");
  });

  it("returns null for an empty href", () => {
    const link = document.createElement("a");
    link.setAttribute("href", "");

    expect(getHref(link)).toBeNull();
  });

  it.each([null, document, document.createElement("div")])(
    "returns null for a target without an href",
    (target) => {
      expect(getHref(target)).toBeNull();
    },
  );
});
