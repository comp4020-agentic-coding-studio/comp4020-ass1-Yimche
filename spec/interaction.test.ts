import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";
import { CIVILISATIONS } from "../src/data/civilisations";

// Contract for the built page's interactive shell. The scale, eras and lane
// packing are covered by timeline.test.ts against the pure model; this checks
// the DOM the visitor actually reaches, plus a keyboard/a11y floor the sensor
// roster does not otherwise watch (see AGENTS.md).

let doc: Document;

beforeAll(() => {
  const distPath = resolve("dist/index.html");
  expect(existsSync(distPath), `${distPath} missing — run pnpm build first`).toBe(true);
  doc = new JSDOM(readFileSync(distPath, "utf8")).window.document;
});

describe("timeline page: the scrollable shell", () => {
  it("ships a live year readout the scroll updates", () => {
    expect(doc.querySelector("#year-readout"), "#year-readout is missing").toBeTruthy();
  });

  it("ships an era readout", () => {
    expect(doc.querySelector("#era-readout"), "#era-readout is missing").toBeTruthy();
  });

  it("ships a progress indicator", () => {
    const bar = doc.querySelector("#timeline-progress, [role='progressbar']");
    expect(bar, "a progress indicator is missing").toBeTruthy();
  });

  it("renders one focusable bar per civilisation, server-side", () => {
    const bars = doc.querySelectorAll(".civ[data-civ]");
    expect(bars.length, "one .civ[data-civ] per civilisation").toBe(CIVILISATIONS.length);
    for (const bar of bars) {
      expect(bar.tagName, "a civ bar must be a <button>, not a clickable div").toBe("BUTTON");
      const name = (bar.textContent ?? "").trim() || bar.getAttribute("aria-label")?.trim();
      expect(name, `civ bar ${bar.getAttribute("data-civ")} needs an accessible name`).toBeTruthy();
    }
  });

  it("labels the timeline with era gridlines", () => {
    expect(doc.querySelectorAll(".era-mark").length).toBeGreaterThanOrEqual(5);
  });
});

describe("timeline page: where and how they relate", () => {
  it("ships a faint world map with one pin per civilisation", () => {
    expect(doc.querySelector(".worldmap"), ".worldmap backdrop is missing").toBeTruthy();
    const pins = doc.querySelectorAll(".map-pin[data-civ]");
    expect(pins.length, "one .map-pin[data-civ] per civilisation").toBe(CIVILISATIONS.length);
  });

  it("ships a connector overlay for relation branching", () => {
    expect(doc.querySelector(".connectors"), ".connectors overlay is missing").toBeTruthy();
  });

  it("gives the detail popup a relations section", () => {
    expect(doc.querySelector("#popup-relations"), "#popup-relations is missing").toBeTruthy();
  });
});

describe("timeline page: keyboard/a11y floor", () => {
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
