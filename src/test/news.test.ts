import { describe, it, expect } from "vitest";
import { getLocalNewsArticles } from "../data/news";

describe("news sorting", () => {
  it("should sort articles by published_at in descending order (newest to oldest)", () => {
    const articles = getLocalNewsArticles();
    expect(articles.length).toBeGreaterThan(1);
    
    for (let i = 0; i < articles.length - 1; i++) {
      const current = new Date(articles[i].published_at).getTime();
      const next = new Date(articles[i + 1].published_at).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});
