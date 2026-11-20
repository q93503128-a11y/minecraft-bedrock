import test from "node:test";
import assert from "node:assert/strict";
import {
  addExperience,
  bladeItemId,
  createProfile,
  rarityForRoll,
  xpToNextLevel,
} from "../BP/scripts/core/progression.js";

test("first level requires 90 XP, with a steady increase", () => {
  assert.equal(xpToNextLevel(1), 90);
  assert.equal(xpToNextLevel(2), 125);
});

test("experience carries across level thresholds", () => {
  const profile = createProfile();
  assert.equal(addExperience(profile, 90), 1);
  assert.equal(profile.level, 2);
  assert.equal(profile.xp, 0);
  assert.equal(addExperience(profile, 285), 2);
  assert.equal(profile.level, 4);
  assert.equal(profile.xp, 0);
});

test("level cap cannot be exceeded", () => {
  const profile = createProfile();
  profile.level = 50;
  profile.xp = 0;
  assert.equal(addExperience(profile, 100000), 0);
  assert.equal(profile.level, 50);
  assert.equal(profile.xp, 0);
});

test("rarity boundaries match the published 40/30/20/8/2 distribution", () => {
  assert.equal(rarityForRoll(0), "common");
  assert.equal(rarityForRoll(39.99), "common");
  assert.equal(rarityForRoll(40), "uncommon");
  assert.equal(rarityForRoll(70), "rare");
  assert.equal(rarityForRoll(90), "epic");
  assert.equal(rarityForRoll(98), "legendary");
  assert.equal(bladeItemId("legendary"), "gtrpg:ember_blade_legendary");
  assert.throws(() => rarityForRoll(100), RangeError);
});
