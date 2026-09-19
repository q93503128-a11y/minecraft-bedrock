const STARTER_COMMON_THRESHOLD = 6;

const scenarios = {
  rich_ore: { chance: 0.120, pity: 5 },
  common_ore: { chance: 0.060, pity: 12 },
  logging: { chance: 0.020, pity: 32 },
  farming: { chance: 0.030, pity: 24 },
  hostile_combat: { chance: 0.040, pity: 20 },
  fishing_ordinary: { chance: 0.150, pity: 8 },
  fishing_treasure: { chance: 0.350, pity: 4 },
  quarry_bulk: { chance: 0.0015, pity: 256 }
};

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runScenario(name, cfg, seed) {
  const random = mulberry32(seed);
  let starterDone = false;
  let starterProgress = 0;
  let pityProgress = 0;
  let sinceDrop = 0;
  let firstDropAt = null;
  let maxGap = 0;
  let drops = 0;
  const iterations = 200000;

  for (let action = 1; action <= iterations; action++) {
    sinceDrop++;
    let dropped = false;

    if (random() < cfg.chance) {
      dropped = true;
      pityProgress = 0;
      starterDone = true;
      starterProgress = 0;
    } else {
      pityProgress++;
      if (pityProgress >= cfg.pity) {
        dropped = true;
        pityProgress = 0;
        starterDone = true;
        starterProgress = 0;
      } else if (!starterDone) {
        starterProgress++;
        if (starterProgress >= STARTER_COMMON_THRESHOLD) {
          dropped = true;
          starterDone = true;
          starterProgress = 0;
          pityProgress = 0;
        }
      }
    }

    if (dropped) {
      if (firstDropAt === null) firstDropAt = action;
      maxGap = Math.max(maxGap, sinceDrop);
      sinceDrop = 0;
      drops++;
    }
  }

  maxGap = Math.max(maxGap, sinceDrop);
  assert(firstDropAt !== null, name + ": no common fragment in simulation");
  assert(firstDropAt <= Math.min(STARTER_COMMON_THRESHOLD, cfg.pity),
    name + ": first fragment exceeded starter/pity bound: " + firstDropAt);
  assert(maxGap <= cfg.pity,
    name + ": post-starter pity gap exceeded threshold: " + maxGap + " > " + cfg.pity);

  return {
    scenario: name,
    actions: iterations,
    drops,
    firstDropAt,
    maxGap,
    averageActionsPerDrop: Number((iterations / drops).toFixed(3))
  };
}

const reports = Object.entries(scenarios).map(([name, cfg], index) =>
  runScenario(name, cfg, 0x4c55434b + index * 7919)
);

for (const report of reports) console.log(JSON.stringify(report));
console.log("acquisition simulation OK");
