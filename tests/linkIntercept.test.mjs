// Run: npm test  (node --test, Node 22.18+ strips the TypeScript types).
import { test } from "node:test";
import assert from "node:assert/strict";
import { guardedHref } from "../src/components/ui/linkIntercept.ts";

const here = "https://ilp.example/lawyer/availability?tab=hours";
const click = (over = {}) => ({ button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false, ...over });

test("plain clicks on same-origin links to another page are guarded", () => {
  assert.equal(guardedHref(click(), { href: "/lawyer" }, here), "https://ilp.example/lawyer");
  assert.equal(guardedHref(click(), { href: "board" }, here), "https://ilp.example/lawyer/board");
  assert.equal(guardedHref(click(), { href: "https://ilp.example/dashboard?x=1#top" }, here), "https://ilp.example/dashboard?x=1#top");
  assert.equal(guardedHref(click(), { href: "/lawyer/availability?tab=days" }, here), "https://ilp.example/lawyer/availability?tab=days");
  assert.equal(guardedHref(click(), { href: "/lawyer", target: "_self" }, here), "https://ilp.example/lawyer");
  assert.equal(guardedHref(click(), { href: "/lawyer", target: "" }, here), "https://ilp.example/lawyer");
});

test("modifier keys and non-primary buttons open elsewhere, so they pass", () => {
  for (const k of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) {
    assert.equal(guardedHref(click({ [k]: true }), { href: "/lawyer" }, here), null, k);
  }
  assert.equal(guardedHref(click({ button: 1 }), { href: "/lawyer" }, here), null);
  assert.equal(guardedHref(click({ defaultPrevented: true }), { href: "/lawyer" }, here), null);
});

test("other targets, downloads and opt-outs pass", () => {
  assert.equal(guardedHref(click(), { href: "/lawyer", target: "_blank" }, here), null);
  assert.equal(guardedHref(click(), { href: "/lawyer", target: "report" }, here), null);
  assert.equal(guardedHref(click(), { href: "/export.csv", download: true }, here), null);
  assert.equal(guardedHref(click(), { href: "/lawyer", optOut: true }, here), null);
});

test("hash-only links and the current page pass", () => {
  assert.equal(guardedHref(click(), { href: "#shell-main-lawyer" }, here), null);
  assert.equal(guardedHref(click(), { href: "/lawyer/availability?tab=hours#days" }, here), null);
  assert.equal(guardedHref(click(), { href: "/lawyer/availability?tab=hours" }, here), null);
});

test("other origins, other schemes and missing hrefs pass", () => {
  assert.equal(guardedHref(click(), { href: "https://calendar.google.com/" }, here), null);
  assert.equal(guardedHref(click(), { href: "http://ilp.example/lawyer" }, here), null);
  assert.equal(guardedHref(click(), { href: "mailto:help@ilp.example" }, here), null);
  assert.equal(guardedHref(click(), { href: "tel:+50622223333" }, here), null);
  assert.equal(guardedHref(click(), { href: "javascript:void(0)" }, here), null);
  assert.equal(guardedHref(click(), { href: null }, here), null);
  assert.equal(guardedHref(click(), { href: "   " }, here), null);
});
