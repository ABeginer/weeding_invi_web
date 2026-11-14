import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { rateLimit, tooManyRequests } from "../lib/server/rate-limit.ts";

function request(ip: string): Request {
  return new Request("https://inviwedd.test/api/rsvp", {
    headers: { "cf-connecting-ip": ip },
  });
}

describe("lib/server/rate-limit.ts", () => {
  it("cho phép tới giới hạn rồi chặn với retryAfter", () => {
    const ip = `10.1.0.${Math.floor(Math.random() * 250)}`;
    const name = `limit-${Math.random().toString(36).slice(2)}`;

    for (let i = 0; i < 3; i += 1) {
      assert.equal(rateLimit(request(ip), name, 3, 60_000).ok, true);
    }

    const blocked = rateLimit(request(ip), name, 3, 60_000);
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfterSec >= 1);
  });

  it("tách bộ đếm theo IP", () => {
    const name = `scope-${Math.random().toString(36).slice(2)}`;
    const a = request("10.2.0.1");
    const b = request("10.2.0.2");

    assert.equal(rateLimit(a, name, 1, 60_000).ok, true);
    assert.equal(rateLimit(a, name, 1, 60_000).ok, false);
    assert.equal(rateLimit(b, name, 1, 60_000).ok, true);
  });

  it("trả 429 kèm Retry-After và mã RATE_LIMITED", async () => {
    const res = tooManyRequests({ ok: false, retryAfterSec: 42 });
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("retry-after"), "42");
    const body = (await res.json()) as { code?: string };
    assert.equal(body.code, "RATE_LIMITED");
  });
});
