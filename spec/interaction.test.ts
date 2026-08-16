import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";

// Contract for the built page's interactive shell. The choreography itself is
// covered by scenario.test.ts against the pure model; this checks the DOM the
// visitor actually reaches, and a keyboard/a11y floor the sensor roster does
// not otherwise watch (see AGENTS.md). The demo is now a guided, scripted
// walkthrough, so the controls are playback (play/step/reset), not manual adds.

let doc: Document;

beforeAll(() => {
  const distPath = resolve("dist/index.html");
  expect(existsSync(distPath), `${distPath} missing — run pnpm build first`).toBe(true);
  doc = new JSDOM(readFileSync(distPath, "utf8")).window.document;
});

describe("airport page: interactive shell", () => {
  it("ships the playback controls as real buttons", () => {
    for (const id of ["#play", "#step", "#reset"]) {
      const el = doc.querySelector(id);
      expect(el, `${id} is missing from the built page`).toBeTruthy();
      expect(el!.tagName, `${id} must be a <button>, not a clickable div`).toBe("BUTTON");
    }
  });

  it("ships the scene hotspots as real, named buttons", () => {
    for (const id of ["#open-gate", "#open-tower"]) {
      const el = doc.querySelector(id);
      expect(el, `${id} is missing from the built page`).toBeTruthy();
      expect(el!.tagName, `${id} must be a <button>, not a clickable div`).toBe("BUTTON");
      const name = (el!.textContent ?? "").trim() || el!.getAttribute("aria-label")?.trim();
      expect(name, `${id} needs an accessible name`).toBeTruthy();
    }
  });

  it("draws at least one runway as the scarce resource", () => {
    const runways = doc.querySelectorAll(".runway[data-runway]");
    expect(runways.length).toBeGreaterThan(0);
  });

  it("gives the scene a text alternative", () => {
    const scene = doc.querySelector('.scene [role="img"]');
    expect(scene, "the SVG scene needs role=img").toBeTruthy();
    expect(scene!.getAttribute("aria-label")?.trim()).toBeTruthy();
  });
});

describe("airport page: keyboard/a11y floor", () => {
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
