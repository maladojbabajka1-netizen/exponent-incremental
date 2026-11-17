
/* =========================================================
   EXPONENT — MASSIVE CONTENT UPDATE
   400 upgrades, 5 currencies, generators, prestige,
   evil prestige, achievements, challenges, offline progress.
   ========================================================= */

"use strict";

const SAVE_KEY = "exponent_save_v5";

const ERAS = [
  {
    id: "energy",
    name: "Energy",
    symbol: "⚡",
    generator: "Energy Generator",
    baseCost: 10,
    unlockCost: 1000000,
    color: "#66d9ff"
  },
  {
    id: "matter",
    name: "Matter",
    symbol: "◆",
    generator: "Matter Extractor",
    baseCost: 100,
    unlockCost: 1000000,
    color: "#b58cff"
  },
  {
    id: "quantum",
    name: "Quantum",
    symbol: "◈",
    generator: "Quantum Reactor",
    baseCost: 1000,
    unlockCost: 1000000,
    color: "#ff80c8"
  },
  {
    id: "singularity",
    name: "Singularity",
    symbol: "●",
    generator: "Singularity Engine",
    baseCost: 10000,
    unlockCost: 1000000,
    color: "#ffad66"
  },
  {
    id: "eternity",
    name: "Eternity",
    symbol: "∞",
    generator: "Eternity Core",
    baseCost: 100000,
    unlockCost: null,
    color: "#ffe66d"
  }
];

const UPGRADE_PREFIXES = [
  "Improved",
  "Advanced",
  "Enhanced",
  "Unstable",
  "Efficient",
  "Experimental",
  "Overcharged",
  "Refined",
  "Accelerated",
  "Transcendent",
  "Hyper",
  "Infinite",
  "Perfect",
  "Extreme",
  "Quantum",
  "Cosmic",
  "Dimensional",
  "Absolute",
  "Eternal",
  "Ultimate"
];

const UPGRADE_NAMES = [
  "Production",
  "Generators",
  "Efficiency",
  "Compression",
  "Expansion",
  "Amplification",
  "Conversion",
  "Resonance",
  "Stability",
  "Acceleration",
  "Power",
  "Density",
  "Replication",
  "Optimization",
  "Synchronization",
  "Overclocking",
  "Processing",
  "Collection",
  "Distortion",
  "Reconstruction"
];

const ACHIEVEMENTS = [
  ["First Spark", "Generate your first 10 Energy.", "energy", 10],
  ["Getting Started", "Reach 100 Energy.", "energy", 100],
  ["Power Plant", "Reach 10,000 Energy.", "energy", 10000],
  ["Energy Addict", "Reach 1 million Energy.", "energy", 1e6],
  ["Matter Matters", "Reach 100 Matter.", "matter", 100],
  ["Matter Master", "Reach 100,000 Matter.", "matter", 1e5],
  ["Quantum Leap", "Reach 100 Quantum.", "quantum", 100],
  ["Quantum Storm", "Reach 100,000 Quantum.", "quantum", 1e5],
  ["Singularity", "Reach 100 Singularity.", "singularity", 100],
  ["Beyond Reality", "Reach 100,000 Singularity.", "singularity", 1e5],
  ["Forever", "Reach 100 Eternity.", "eternity", 100],
  ["Endless", "Reach 100,000 Eternity.", "eternity", 1e5],
  ["First Generator", "Own 10 generators.", "generators", 10],
  ["Factory", "Own 100 generators.", "generators", 100],
  ["Industrial", "Own 500 generators.", "generators", 500],
  ["Upgrade Beginner", "Buy 10 upgrades.", "upgrades", 10],
  ["Upgrade Expert", "Buy 50 upgrades.", "upgrades", 50],
  ["Upgrade Collector", "Buy 100 upgrades.", "upgrades", 100],
  ["Upgrade Maniac", "Buy 200 upgrades.", "upgrades", 200],
  ["Upgrade Legend", "Buy all 400 upgrades.", "upgrades", 400],
  ["First Reset", "Perform your first Prestige.", "prestige", 1],
  ["Experienced", "Perform 10 Prestiges.", "prestige", 10],
  ["Evil Begins", "Perform your first Evil Prestige.", "evil", 1],
  ["Dark Power", "Earn 100 Evil Shards.", "shards", 100],
  ["Clicker", "Click 1,000 times.", "clicks", 1000],
  ["Dedicated", "Play for 1 hour.", "time", 3600],
  ["Challenge Accepted", "Complete a challenge.", "challenges", 1],
  ["Challenge Master", "Complete all challenges.", "challenges", 3]
];

const CHALLENGES = [
  {
    id: "slow",
    name: "Slow Universe",
    description: "Generator production is reduced. Complete the challenge by reaching 10,000 Energy.",
    target: 10000,
    reward: "Permanent +10% production",
    multiplier: 0.5
  },
  {
    id: "expensive",
    name: "Inflation",
    description: "Generators cost more. Reach 100,000 Energy.",
    target: 100000,
    reward: "Permanent +20% production",
    multiplier: 1
  },
  {
    id: "click",
    name: "Manual Labor",
    description: "Generators are disabled. Reach 5,000 Energy through clicking.",
    target: 5000,
    reward: "Permanent +30% clicking power",
    multiplier: 1
  }
];

function freshSave() {
  return {
    version: 5,

    currencies: {
      energy: 0,
      matter: 0,
      quantum: 0,
      singularity: 0,
      eternity: 0
    },

    lifetime: {
      energy: 0,
      matter: 0,
      quantum: 0,
      singularity: 0,
      eternity: 0
    },

    generators: {
      energy: 0,
      matter: 0,
      quantum: 0,
      singularity: 0,
      eternity: 0
    },

    unlocked: ["energy"],
    upgrades: [],
    achievements: [],
    completedChallenges: [],

    prestigePoints: 0,
    prestigeCount: 0,

    evilShards: 0,
    evilPrestigeCount: 0,

    clicks: 0,
    totalGeneratorsBought: 0,
    totalPlaytime: 0,

    activeChallenge: null,
    challengeProgress: 0,

    lastSave: Date.now()
  };
}

let game = freshSave();
let activeTab = "main";
let lastTick = Date.now();
let toastTimer = null;

// ---------------------------------------------------------
// SAVE SYSTEM
// ---------------------------------------------------------

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);

    if (!raw) return;

    const saved = JSON.parse(raw);
    const defaults = freshSave();

    game = {
      ...defaults,
      ...saved,

      currencies: {
        ...defaults.currencies,
        ...(saved.currencies || {})
      },

      lifetime: {
        ...defaults.lifetime,
        ...(saved.lifetime || {})
      },

      generators: {
        ...defaults.generators,
        ...(saved.generators || {})
      }
    };

    game.unlocked ||= ["energy"];
    game.upgrades ||= [];
    game.achievements ||= [];
    game.completedChallenges ||= [];
  } catch (error) {
    console.error("Save loading failed:", error);
    game = freshSave();
  }
}

function saveGame() {
  game.lastSave = Date.now();

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  } catch (error) {
    console.error("Save failed:", error);
  }
}

function showToast(message) {
  let toast = document.getElementById("game-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "game-toast";

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "25px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#272744",
      color: "white",
      padding: "12px 18px",
      borderRadius: "12px",
      zIndex: "9999",
      maxWidth: "90%",
      textAlign: "center",
      boxShadow: "0 5px 25px #0008"
    });

    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.display = "block";

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}

// ---------------------------------------------------------
// NUMBER FORMATTING
// ---------------------------------------------------------

function format(value) {
  if (!Number.isFinite(value)) return "∞";

  if (Math.abs(value) < 1000) {
    return value.toFixed(value < 10 && value % 1 ? 2 : 0);
  }

  const suffixes = [
    "", "K", "M", "B", "T", "Qa",
    "Qi", "Sx", "Sp", "Oc", "No", "Dc"
  ];

  const tier = Math.floor(Math.log10(Math.abs(value)) / 3);

  if (tier >= suffixes.length) {
    return value.toExponential(2);
  }

  return (
    (value / Math.pow(1000, tier)).toFixed(2) +
    suffixes[tier]
  );
}

function getEra(id) {
  return ERAS.find(era => era.id === id);
}

function highestEraIndex() {
  let index = 0;

  ERAS.forEach((era, i) => {
    if (game.unlocked.includes(era.id)) index = i;
  });

  return index;
}

function activeEra() {
  return ERAS[highestEraIndex()];
}

// ---------------------------------------------------------
// 400 UPGRADE GENERATOR
// ---------------------------------------------------------

const ALL_UPGRADES = [];

ERAS.forEach((era, eraIndex) => {
  for (let i = 0; i < 80; i++) {
    const prefix = UPGRADE_PREFIXES[
      Math.floor(i / 4) % UPGRADE_PREFIXES.length
    ];

    const name = UPGRADE_NAMES[
      (i + eraIndex * 3) % UPGRADE_NAMES.length
    ];

    const number = i + 1;

    let type = "production";
    let effect = 1.08 + (i % 8) * 0.025;

    if (i % 10 === 4) {
      type = "global";
      effect = 1.02 + (i % 5) * 0.01;
    }

    if (i % 10 === 7) {
      type = "click";
      effect = 1.15 + (i % 5) * 0.05;
    }

    if (i % 10 === 9) {
      type = "generator";
      effect = 1.1 + (i % 5) * 0.05;
    }

    ALL_UPGRADES.push({
      id: era.id + "_upgrade_" + number,
      era: era.id,
      eraIndex,
      number,
      name: prefix + " " + name + " " + number,
      type,
      effect,
      cost: era.baseCost * 10 * Math.pow(1.55, i),
      description: getUpgradeDescription(type, effect)
    });
  }
});

function getUpgradeDescription(type, effect) {
  const percent = Math.round((effect - 1) * 100);

  if (type === "global") {
    return "Increase all production by " + percent + "%.";
  }

  if (type === "click") {
    return "Increase clicking power by " + percent + "%.";
  }

  if (type === "generator") {
    return "Increase generator production by " + percent + "%.";
  }

  return "Increase this currency's production by " + percent + "%.";
}

function upgradeOwned(id) {
  return game.upgrades.includes(id);
}

function buyUpgrade(id) {
  const upgrade = ALL_UPGRADES.find(item => item.id === id);

  if (!upgrade || upgradeOwned(id)) return;

  if (!game.unlocked.includes(upgrade.era)) {
    showToast("Unlock this currency first!");
    return;
  }

  if (game.currencies[upgrade.era] < upgrade.cost) {
    showToast("Not enough " + getEra(upgrade.era).name + "!");
    return;
  }

  game.currencies[upgrade.era] -= upgrade.cost;
  game.upgrades.push(id);

  showToast("Purchased: " + upgrade.name);

  checkAchievements();
  saveGame();
  render();
}

// ---------------------------------------------------------
// PRODUCTION
// ---------------------------------------------------------

function getUpgradeMultiplier(eraId, type) {
  let multiplier = 1;

  ALL_UPGRADES.forEach(upgrade => {
    if (!upgradeOwned(upgrade.id)) return;

    if (type === "global" && upgrade.type === "global") {
      multiplier *= upgrade.effect;
    }

    if (upgrade.era === eraId && upgrade.type === type) {
      multiplier *= upgrade.effect;
    }
  });

  return multiplier;
}

function getPrestigeMultiplier() {
  return (
    1 +
    game.prestigePoints * 0.1 +
    game.evilShards * 0.25
  );
}

function getChallengeMultiplier() {
  if (!game.activeChallenge) return 1;

  const challenge = CHALLENGES.find(
    item => item.id === game.activeChallenge
  );

  return challenge ? challenge.multiplier : 1;
}

function productionFor(eraId) {
  const count = game.generators[eraId] || 0;

  let production = count;

  production *= getUpgradeMultiplier(eraId, "production");
  production *= getUpgradeMultiplier(eraId, "generator");
  production *= getUpgradeMultiplier("all", "global");
  production *= getPrestigeMultiplier();

  if (game.activeChallenge === "slow") {
    production *= 0.5;
  }

  if (game.activeChallenge === "click") {
    production = 0;
  }

  return production;
}

function totalProduction() {
  let total = 0;

  ERAS.forEach(era => {
    if (game.unlocked.includes(era.id)) {
      total += productionFor(era.id);
    }
  });

  return total;
}

function generateClick() {
  const era = activeEra();

  let amount = 1;

  amount *= getUpgradeMultiplier(era.id, "click");
  amount *= getPrestigeMultiplier();

  if (game.activeChallenge === "slow") {
    amount *= 0.5;
  }

  if (game.activeChallenge === "click") {
    amount *= 2;
  }

  game.currencies[era.id] += amount;
  game.lifetime[era.id] += amount;

  game.clicks++;

  checkChallenge();
  checkAchievements();
  render();
}

// ---------------------------------------------------------
// GENERATORS
// ---------------------------------------------------------

function generatorCost(eraId) {
  const era = getEra(eraId);
  const count = game.generators[eraId];

  let cost = era.baseCost * Math.pow(1.17, count);

  if (game.activeChallenge === "expensive") {
    cost *= 3;
  }

  return cost;
}

function buyGenerator(eraId) {
  if (!game.unlocked.includes(eraId)) return;

  if (game.activeChallenge === "click") {
    showToast("Generators are disabled in this challenge!");
    return;
  }

  const cost = generatorCost(eraId);

  if (game.currencies[eraId] < cost) {
    showToast("Not enough currency!");
    return;
  }

  game.currencies[eraId] -= cost;
  game.generators[eraId]++;
  game.totalGeneratorsBought++;

  showToast("Generator purchased!");

  checkAchievements();
  saveGame();
  render();
}

function buyMaxGenerators(eraId) {
  let bought = 0;

  for (let i = 0; i < 1000; i++) {
    const cost = generatorCost(eraId);

    if (game.currencies[eraId] < cost) break;

    game.currencies[eraId] -= cost;
    game.generators[eraId]++;
    game.totalGeneratorsBought++;

    bought++;
  }

  if (bought > 0) {
    showToast("Bought " + bought + " generators!");
    checkAchievements();
    saveGame();
    render();
  } else {
    showToast("Not enough currency!");
  }
}

// ---------------------------------------------------------
// CURRENCY MILESTONES
// ---------------------------------------------------------

function unlockNextEra() {
  const index = highestEraIndex();
  const next = ERAS[index + 1];

  if (!next) return;

  const current = ERAS[index];

  if (game.currencies[current.id] < next.unlockCost) {
    showToast("Not enough " + current.name + "!");
    return;
  }

  game.currencies[current.id] -= next.unlockCost;
  game.unlocked.push(next.id);

  showToast(next.name + " unlocked!");

  saveGame();
  render();
}

// ---------------------------------------------------------
// PRESTIGE
// ---------------------------------------------------------

function prestigeReward() {
  return Math.floor(
    Math.sqrt(game.lifetime.energy / 1000000)
  );
}

function doPrestige() {
  const reward = prestigeReward();

  if (reward < 1) {
    showToast("You need more lifetime Energy!");
    return;
  }

  if (!confirm(
    "Prestige for " + reward +
    " Prestige Points? Your ordinary progress will reset."
  )) return;

  game.prestigePoints += reward;
  game.prestigeCount++;

  resetRun();

  showToast("Prestige complete! +" + reward + " points.");

  checkAchievements();
  saveGame();
  render();
}

function evilPrestigeReward() {
  if (game.prestigePoints < 100) return 0;
  if (game.currencies.eternity < 1000000) return 0;

  return Math.max(
    1,
    Math.floor(Math.sqrt(game.prestigePoints / 100))
  );
}

function doEvilPrestige() {
  const reward = evilPrestigeReward();

  if (reward < 1) {
    showToast(
      "Requires 100 Prestige Points and 1M Eternity!"
    );
    return;
  }

  if (!confirm(
    "Perform EVIL PRESTIGE for " +
    reward + " Evil Shards?"
  )) return;

  game.evilShards += reward;
  game.evilPrestigeCount++;

  game.prestigePoints = 0;
  game.prestigeCount = 0;

  resetRun();

  showToast("EVIL PRESTIGE! +" + reward + " Evil Shards.");

  checkAchievements();
  saveGame();
  render();
}

function resetRun() {
  ERAS.forEach(era => {
    game.currencies[era.id] = 0;
    game.generators[era.id] = 0;
  });

  game.unlocked = ["energy"];
  game.upgrades = [];
  game.activeChallenge = null;
  game.challengeProgress = 0;
}

// ---------------------------------------------------------
// CHALLENGES
// ---------------------------------------------------------

function startChallenge(id) {
  const challenge = CHALLENGES.find(item => item.id === id);

  if (!challenge) return;

  if (game.completedChallenges.includes(id)) {
    showToast("Challenge already completed!");
    return;
  }

  if (game.activeChallenge) {
    showToast("Finish or exit your current challenge first.");
    return;
  }

  if (!confirm("Start " + challenge.name + "?")) return;

  resetRun();

  game.activeChallenge = id;
  game.challengeProgress = 0;

  showToast("Challenge started: " + challenge.name);

  saveGame();
  render();
}

function exitChallenge() {
  if (!game.activeChallenge) return;

  if (!confirm("Exit this challenge? Your challenge run will reset.")) {
    return;
  }

  game.activeChallenge = null;
  game.challengeProgress = 0;

  resetRun();

  saveGame();
  render();
}

function checkChallenge() {
  if (!game.activeChallenge) return;

  const challenge = CHALLENGES.find(
    item => item.id === game.activeChallenge
  );

  if (!challenge) return;

  const progress = game.currencies.energy;

  game.challengeProgress = progress;

  if (progress >= challenge.target) {
    game.completedChallenges.push(challenge.id);
    game.activeChallenge = null;

    showToast("Challenge completed: " + challenge.name + "!");

    checkAchievements();
    saveGame();
  }
}

// ---------------------------------------------------------
// ACHIEVEMENTS
// ---------------------------------------------------------

function achievementProgress(type) {
  switch (type) {
    case "energy":
    case "matter":
    case "quantum":
    case "singularity":
    case "eternity":
      return game.lifetime[type];

    case "generators":
      return game.totalGeneratorsBought;

    case "upgrades":
      return game.upgrades.length;

    case "prestige":
      return game.prestigeCount;

    case "evil":
      return game.evilPrestigeCount;

    case "shards":
      return game.evilShards;

    case "clicks":
      return game.clicks;

    case "time":
      return game.totalPlaytime;

    case "challenges":
      return game.completedChallenges.length;

    default:
      return 0;
  }
}

function checkAchievements() {
  ACHIEVEMENTS.forEach((achievement, index) => {
    const [name, description, type, target] = achievement;

    if (game.achievements.includes(index)) return;

    if (achievementProgress(type) >= target) {
      game.achievements.push(index);
      showToast("Achievement unlocked: " + name + "!");
    }
  });
}

// ---------------------------------------------------------
// OFFLINE PROGRESS
// ---------------------------------------------------------

function applyOfflineProgress() {
  if (!game.lastSave) return;

  const seconds = Math.min(
    28800,
    Math.max(0, (Date.now() - game.lastSave) / 1000)
  );

  if (seconds < 5) return;

  if (game.activeChallenge) return;

  let earned = 0;

  ERAS.forEach(era => {
    if (!game.unlocked.includes(era.id)) return;

    const amount = productionFor(era.id) * seconds;

    game.currencies[era.id] += amount;
    game.lifetime[era.id] += amount;

    earned += amount;
  });

  if (earned > 0) {
    showToast(
      "Welcome back! You earned " +
      format(earned) + " resources offline."
    );
  }
}

// ---------------------------------------------------------
// UI HELPERS
// ---------------------------------------------------------

function addTabs() {
  const nav = document.querySelector("nav");

  if (!nav) return;

  const extraTabs = [
    ["achievements", "Achievements"],
    ["challenges", "Challenges"]
  ];

  extraTabs.forEach(([id, label]) => {
    if (nav.querySelector('[data-tab="' + id + '"]')) return;

    const button = document.createElement("button");

    button.dataset.tab = id;
    button.textContent = label;

    nav.appendChild(button);
  });
}

function card(title, body, footer = "") {
  return `
    <div class="upgrade-card" style="
      background:#17172b;
      border:1px solid #30304b;
      border-radius:14px;
      padding:15px;
      margin:10px 0;
    ">
      <h3>${title}</h3>
      <p>${body}</p>
      ${footer}
    </div>
  `;
}

function actionButton(label, action, disabled = false) {
  return `
    <button
      data-action="${action}"
      ${disabled ? "disabled" : ""}
      style="
        width:100
