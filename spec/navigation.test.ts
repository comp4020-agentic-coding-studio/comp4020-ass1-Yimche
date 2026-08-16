import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";
import { groupById } from "../src/data/civilisations";
import { packLanes } from "../src/scripts/timeline";

// Contract for the group rail: the navigation that makes the timeline usable
// where it cannot fit one frame. On a phone 32 lanes can't share the width, so
// the page pages across the groups; the rail is the deliberate jump control. It
// must name every group the model lays out, and every entry must resolve to a
// real group (see AGENTS.md). Fit itself is CSS, verified against the rendered
// page, not here.

let doc: Document;

beforeAll(() => {
  const distPath = resolve("dist/index.html");
  expect(existsSync(distPath), `${distPath} missing — run pnpm build first`).toBe(true);
  doc = new JSDOM(readFileSync(distPath, "utf8")).window.document;
});

describe("timeline page: the group rail", () => {
  it("ships a group rail", () => {
    expect(doc.querySelector(".group-rail"), ".group-rail is missing").toBeTruthy();
  });

  it("offers one jump control per group the model lays out", () => {
    const { groups } = packLanes();
    const buttons = doc.querySelectorAll(".group-rail button[data-group]");
    expect(buttons.length, "one .group-rail button[data-group] per group band").toBe(
      groups.length,
    );
  });

  it("names every control and points each at a real group", () => {
    for (const btn of doc.querySelectorAll<HTMLButtonElement>(".group-rail button[data-group]")) {
      const id = btn.getAttribute("data-group") ?? "";
      expect(groupById.has(id), `rail control data-group="${id}" is not a real group`).toBe(true);
      const name = (btn.textContent ?? "").trim() || btn.getAttribute("aria-label")?.trim();
      expect(name, `rail control for ${id} needs an accessible name`).toBeTruthy();
    }
  });
});
