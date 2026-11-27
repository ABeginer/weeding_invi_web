import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyCoupleNames,
  buildQuizQuestionsForTopic,
  formatGroupChatQuizText,
  formatMcScriptText,
} from "../lib/wedding-quiz-builder.ts";

describe("wedding-quiz-builder helpers", () => {
  it("replaces couple placeholders cleanly and filters by selected topic", () => {
    assert.equal(
      applyCoupleNames("{groom} và {bride} quen nhau ở đâu?", "Tuấn", "Lan"),
      "Tuấn và Lan quen nhau ở đâu?",
    );

    const loveOnly = buildQuizQuestionsForTopic("love_story", "Tuấn", "Lan");
    assert.ok(loveOnly.length >= 4);
    assert.ok(loveOnly.every((q) => q.topic === "love_story" && q.selected));

    const allTopics = buildQuizQuestionsForTopic("all", "Tuấn", "Lan");
    const selectedCount = allTopics.filter((q) => q.selected).length;
    assert.equal(selectedCount, 8);
  });

  it("formats both stage MC scripts (with answer key) and group chat quiz text (without spoiling answers)", () => {
    const questions = buildQuizQuestionsForTopic("love_story", "Minh", "Vy").slice(0, 2);
    const config = {
      groomName: "Minh",
      brideName: "Vy",
      topic: "love_story" as const,
      outputMode: "mc_script" as const,
    };

    const mcText = formatMcScriptText(config, questions);
    assert.match(mcText, /KỊCH BẢN MINIGAME: BẠN HIỂU MINH & VY/);
    assert.match(mcText, /Đáp án đúng:/);

    const chatText = formatGroupChatQuizText(config, questions);
    assert.match(chatText, /MINI QUIZ TRƯỚC GIỜ CƯỚI/);
    assert.doesNotMatch(chatText, /Đáp án đúng:/);
  });
});
