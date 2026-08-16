import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";

// Contract for the built page's interactive shell. The timeline UI's own
// contract is added alongside this in the next commit; for now this holds the
// keyboard/a11y floor the sensor roster does not otherwise watch (see
// AGENTS.md).

let doc: Document;

beforeAll(() => {
  const distPath = resolve("dist/index.html");
  expect(existsSync(distPath), `${distPath} missing — run pnpm build first`).toBe(true);
  doc = new JSDOM(readFileSync(distPath, "utf8")).window.document;
});

describe("page: keyboard/a11y floor", () => {
  it("every button has an accessible name", () => {
    for (const btn of doc.querySelectorAll("button")) {
      const name = (btn.textContent ?? "").trim() || btn.getAttribute("aria-label")?.trim();
      expect(name, `a <button> has no accessible name: ${btn.outerHTML}`).toBeTruthy();
    }
  });

  it("does not wire clicks onto non-interactive elements", () => {
    const handlers = doc.querySelectorAll("[onclick]");
    expect(handlers.length, "use <button>, not onclick on divs/spans").toBe(0);
  });
});
