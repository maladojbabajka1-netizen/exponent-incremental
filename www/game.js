
const SAVE_KEY = "exponent_save_v3";

const ERAS = [
  {
    id: "energy",
    name: "Energy",
    color: "#a78bfa",
    generatorCost: 10,
    generatorGrowth: 1.15,
    generatorPower: 1,
    upgradeCost: 50,
    upgradePower: 2,
    nextCost: 1000,
    nextName: "Matter"
  },
  {
    id: "matter",
    name: "Matter",
    color: "#60a5fa",
    generatorCost: 25,
    generatorGrowth: 1.18,
    generatorPower: 2,
    upgradeCost: 150,
    upgradePower: 3,
    nextCost: 2500,
    nextName: "Quantum"
  },
  {
    id: "quantum",
    name: "Quantum",
    color: "#c084fc",
    generatorCost: 50,
    generatorGrowth: 1.20,
    generatorPower: 5,
    upgradeCost: 300,
    upgradePower: 4,
    nextCost: 5000,
    nextName: "Singularity"
  },
  {
    id: "singularity",
    name: "Singularity",
    color: "#f472b6",
    generatorCost: 100,
    generatorGrowth: 1.22,
    generatorPower: 10,
    upgradeCost: 600,
    upgradePower: 5,
    nextCost: 10000,
    nextName: "Eternity"
  },
  {
    id: "eternity",
    name: "Eternity",
    color: "#fbbf24",
    generatorCost: 250,
    generatorGrowth: 1.25,
    generatorPower: 25,
    upgradeCost: 1200,
    upgradePower: 10
  }
];

function createDefaultSave() {
  const currencies = {};
  const generators = {};

  ERAS.forEach(era => {
    currencies[era.id] = 0;
    generators[era.id] = 0;
  });

  return {
    currencies,
    generators,
    unlocked: ["energy"],
    upgrades: [],
    lifetime: {},
    runLifetime: {},
    totalClicks: 0,
    prestigeCount: 0,
    prestigePoints: 0,
    evilPrestigeCount: 0
  };
}

let game = createDefaultSave();
let currentTab = "main";

function format(value) {
  if (!Number.isFinite(value)) return "Infinity";
  if (value < 1000) return Math.floor(value).toString();

  if (value >= 1e15) {
    return value.toExponential(2);
  }

  const suffixes = [
    "K", "M", "B", "T",
    "Qa", "Qi", "Sx", "Sp"
  ];

  let tier = -1;

  while (value >= 1000 && tier < suffixes.length - 1) {
    value /= 1000;
    tier++;
  }

  if (value >= 1000) return value.toExponential(2);

  return value.toFixed(2) + suffixes[tier];
}

// SAVE SYSTEM

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));

    if (!saved) return;

    const defaults = createDefaultSave();

    game = {
      ...defaults,
      ...saved,
      currencies: {
        ...defaults.currencies,
        ...(saved.currencies || {})
      },
      generators: {
        ...defaults.generators,
        ...(saved.generators || {})
      },
      lifetime: saved.lifetime || {},
      runLifetime: saved.runLifetime || {},
      unlocked: saved.unlocked || ["energy"],
      upgrades: saved.upgrades || []
    };

  } catch (error) {
    console.log("Could not load save.");
  }
}

function saveGame() {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(game)
  );
}

// CURRENCY SYSTEM

function getActiveEra() {
  return [...ERAS].reverse().find(
    era => game.unlocked.includes(era.id)
  ) || ERAS[0];
}

function getMultiplier(era) {
  return game.upgrades.includes(era.id + "_boost")
    ? era.upgradePower
    : 1;
}

function getPrestigeMultiplier() {
  return 1 + game.prestigePoints * 0.1;
}

function getProduction(era) {
  return game.generators[era.id] *
    era.generatorPower *
    getMultiplier(era) *
    getPrestigeMultiplier();
}

function earnCurrency(id, amount) {
  game.currencies[id] += amount;

  game.lifetime[id] =
    (game.lifetime[id] || 0) + amount;

  game.runLifetime[id] =
    (game.runLifetime[id] || 0) + amount;
}

function generateEnergy() {
  const era = getActiveEra();

  earnCurrency(
    era.id,
    getMultiplier(era) * getPrestigeMultiplier()
  );

  game.totalClicks++;

  updateUI();
  saveGame();
}

// GENERATORS

function getGeneratorCost(era) {
  return Math.ceil(
    era.generatorCost *
    Math.pow(
      era.generatorGrowth,
      game.generators[era.id]
    )
  );
}

function buyGenerator(id) {
  const era = ERAS.find(item => item.id === id);

  if (!era) return;

  const cost = getGeneratorCost(era);

  if (game.currencies[id] < cost) return;

  game.currencies[id] -= cost;
  game.generators[id]++;

  updateUI();
  saveGame();
}

// UPGRADES

function buyUpgrade(id) {
  const era = ERAS.find(item => item.id === id);

  if (!era) return;

  const upgradeId = id + "_boost";

  if (game.upgrades.includes(upgradeId)) return;
  if (game.currencies[id] < era.upgradeCost) return;

  game.currencies[id] -= era.upgradeCost;
  game.upgrades.push(upgradeId);

  updateUI();
  saveGame();
}

// CURRENCY MILESTONES

function unlockEra(id) {
  const index = ERAS.findIndex(item => item.id === id);
  const era = ERAS[index];

  if (!era || !era.nextName) return;

  const nextEra = ERAS[index + 1];

  if (!nextEra) return;
  if (game.unlocked.includes(nextEra.id)) return;
  if (game.currencies[id] < era.nextCost) return;

  game.currencies[id] -= era.nextCost;

  game.upgrades.push(id + "_milestone");
  game.unlocked.push(nextEra.id);

  updateUI();
  saveGame();
}

// PRESTIGE SYSTEM

function getPrestigeReward() {
  const lifetimeEnergy = game.runLifetime.energy || 0;

  return Math.floor(
    Math.sqrt(lifetimeEnergy / 1000000)
  );
}

function canPrestige() {
  return getPrestigeReward() >= 1;
}

function doPrestige() {
  if (!canPrestige()) return;

  const reward = getPrestigeReward();

  const lifetime = { ...game.lifetime };
  const totalClicks = game.totalClicks;
  const prestigePoints = game.prestigePoints + reward;
  const prestigeCount = game.prestigeCount + 1;
  const evilPrestigeCount = game.evilPrestigeCount;

  const fresh = createDefaultSave();

  game = {
    ...fresh,
    lifetime,
    totalClicks,
    prestigePoints,
    prestigeCount,
    evilPrestigeCount
  };

  currentTab = "prestige";

  updateUI();
  saveGame();
}

// INTERFACE

function renderCurrencyHeader() {
  const era = getActiveEra();

  document.querySelector("#currency p").textContent =
    era.name.toUpperCase();

  document.getElementById("energy").textContent =
    format(game.currencies[era.id]);

  document.getElementById("production").textContent =
    "+" + format(getProduction(era)) + " / second";

  document.getElementById("currency").style.borderColor =
    era.color;
}

function renderMain(content) {
  content.innerHTML = `
    <h2>Universe Overview</h2>

    <p>Your universe is expanding. Discover new currencies
    and build increasingly powerful generators.</p>

    <br>
    <h3>Unlocked Currencies</h3>

    ${ERAS.filter(era => game.unlocked.includes(era.id))
      .map(era => `
        <div class="upgrade-card">
          <h3 style="color:${era.color}">
            ${era.name}
          </h3>
          <p>Amount: ${format(game.currencies[era.id])}</p>
          <p>Production: +${format(getProduction(era))}/s</p>
          <p>Generators: ${game.generators[era.id]}</p>
        </div>
      `).join("")}
  `;
}

function renderGenerators(content) {
  content.innerHTML = `
    <h2>Generators</h2>
    <p>Build generators to produce currencies automatically.</p>

    ${ERAS.filter(era => game.unlocked.includes(era.id))
      .map(era => {
        const cost = getGeneratorCost(era);

        return `
          <div class="upgrade-card">
            <h3 style="color:${era.color}">
              ${era.name} Generator
            </h3>

            <p>Owned: ${game.generators[era.id]}</p>

            <p>Produces:
              ${format(
                era.generatorPower *
                getMultiplier(era) *
                getPrestigeMultiplier()
              )} ${era.name}/second
            </p>

            <p>Cost: ${format(cost)} ${era.name}</p>

            <button
              data-generator="${era.id}"
              ${game.currencies[era.id] < cost ? "disabled" : ""}>
              BUY GENERATOR
            </button>
          </div>
        `;
      }).join("")}
  `;

  content.querySelectorAll("[data-generator]").forEach(button => {
    button.addEventListener("click", () => {
      buyGenerator(button.dataset.generator);
    });
  });
}

function renderUpgrades(content) {
  content.innerHTML = `
    <h2>Upgrade Center</h2>
    <p>Improve your production and discover new currencies.</p>

    ${ERAS.filter(era => game.unlocked.includes(era.id))
      .map((era, index) => {
        const upgradeId = era.id + "_boost";
        const purchased = game.upgrades.includes(upgradeId);
        const nextEra = ERAS[index + 1];

        const nextUnlocked = nextEra &&
          game.unlocked.includes(nextEra.id);

        return `
          <div class="upgrade-card">
            <h3 style="color:${era.color}">
              ${era.name} Optimization
            </h3>

            <p>Multiply ${era.name} production by x${era.upgradePower}.</p>
            <p>Cost: ${format(era.upgradeCost)} ${era.name}</p>

            <button
              data-upgrade="${era.id}"
              ${purchased || game.currencies[era.id] < era.upgradeCost ? "disabled" : ""}>
              ${purchased ? "PURCHASED" : "BUY UPGRADE"}
            </button>
          </div>

          ${era.nextName ? `
            <div class="upgrade-card">
              <h3>Milestone: ${era.nextName} Discovery</h3>

              <p>Unlock ${era.nextName} and its generators.</p>
              <p>Cost: ${format(era.nextCost)} ${era.name}</p>

              <button
                data-milestone="${era.id}"
                ${nextUnlocked || game.currencies[era.id] < era.nextCost ? "disabled" : ""}>
                ${nextUnlocked ? "UNLOCKED" : "DISCOVER " + era.nextName.toUpperCase()}
              </button>
            </div>
          ` : ""}
        `;
      }).join("")}
  `;

  content.querySelectorAll("[data-upgrade]").forEach(button => {
    button.addEventListener("click", () => {
      buyUpgrade(button.dataset.upgrade);
    });
  });

  content.querySelectorAll("[data-milestone]").forEach(button => {
    button.addEventListener("click", () => {
      unlockEra(button.dataset.milestone);
    });
  });
}

function renderPrestige(content) {
  const reward = getPrestigeReward();

  content.innerHTML = `
    <h2>Prestige</h2>

    <div class="upgrade-card">
      <h3>Normal Prestige</h3>

      <p>Prestige Points: ${format(game.prestigePoints)}</p>

      <p>Permanent production multiplier:
        x${getPrestigeMultiplier().toFixed(2)}
      </p>

      <p>Run lifetime Energy:
        ${format(game.runLifetime.energy || 0)}
      </p>

      <p>Required: 1,000,000 lifetime Energy</p>

      <p>Available reward:
