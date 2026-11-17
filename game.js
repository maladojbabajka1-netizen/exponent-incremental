
const SAVE_KEY = "exponent_save_v2";

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
    generatorGrowth: 1.2,
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
    totalClicks: 0,
    prestigeCount: 0,
    evilPrestigeCount: 0
  };
}

let game = createDefaultSave();
let currentTab = "main";

function format(value) {
  if (!Number.isFinite(value)) return "Infinity";
  if (value < 1000) return value.toFixed(0);

  if (value >= 1e15) {
    return value.toExponential(2);
  }

  const suffixes = [
    "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp"
  ];

  let tier = -1;

  while (value >= 1000 && tier < suffixes.length - 1) {
    value /= 1000;
    tier++;
  }

  if (value >= 1000) return value.toExponential(2);

  return value.toFixed(2) + suffixes[tier];
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));

    if (!saved) return;

    if (saved.currencies && saved.unlocked) {
      game = {
        ...createDefaultSave(),
        ...saved,
        currencies: {
          ...createDefaultSave().currencies,
          ...saved.currencies
        },
        generators: {
          ...createDefaultSave().generators,
          ...saved.generators
        }
      };
    }
  } catch (error) {
    console.log("Could not load save.");
  }
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(game));
}

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

function getProduction(era) {
  return game.generators[era.id] *
    era.generatorPower *
    getMultiplier(era);
}

function earnCurrency(id, amount) {
  game.currencies[id] += amount;

  game.lifetime[id] =
    (game.lifetime[id] || 0) + amount;
}

function generateEnergy() {
  const era = getActiveEra();

  earnCurrency(era.id, getMultiplier(era));
  game.totalClicks++;

  updateUI();
  saveGame();
}

function buyGenerator(id) {
  const era = ERAS.find(item => item.id === id);
  const cost = getGeneratorCost(era);

  if (!era || game.currencies[id] < cost) return;

  game.currencies[id] -= cost;
  game.generators[id]++;

  updateUI();
  saveGame();
}

function getGeneratorCost(era) {
  return Math.ceil(
    era.generatorCost *
    Math.pow(
      era.generatorGrowth,
      game.generators[era.id]
    )
  );
}

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

function unlockEra(id) {
  const index = ERAS.findIndex(item => item.id === id);
  const era = ERAS[index];

  if (!era || !era.nextName) return;

  const nextEra = ERAS[index + 1];
  const unlockId = id + "_milestone";

  if (game.unlocked.includes(nextEra.id)) return;
  if (game.currencies[id] < era.nextCost) return;

  game.currencies[id] -= era.nextCost;
  game.upgrades.push(unlockId);
  game.unlocked.push(nextEra.id);

  updateUI();
  saveGame();
}

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
    <p>Your universe is expanding. Keep upgrading to discover new currencies.</p>
    <br>
    <h3>Unlocked Currencies</h3>
    <br>
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
    <p>Generators automatically produce their own currency.</p>
    ${ERAS.filter(era => game.unlocked.includes(era.id))
      .map(era => {
        const cost = getGeneratorCost(era);

        return `
          <div class="upgrade-card">
            <h3 style="color:${era.color}">
              ${era.name} Generator
            </h3>
            <p>Owned: ${game.generators[era.id]}</p>
            <p>Produces ${format(
              era.generatorPower * getMultiplier(era)
            )} ${era.name}/second</p>
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
    <p>Improve your production and unlock new dimensions.</p>
    ${ERAS.filter(era => game.unlocked.includes(era.id))
      .map((era, index) => {
        const upgradeId = era.id + "_boost";
        const milestoneId = era.id + "_milestone";
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
            <button data-upgrade="${era.id}"
              ${purchased || game.currencies[era.id] < era.upgradeCost ? "disabled" : ""}>
              ${purchased ? "PURCHASED" : "BUY UPGRADE"}
            </button>
          </div>

          ${era.nextName ? `
            <div class="upgrade-card">
              <h3>Milestone: ${era.nextName} Discovery</h3>
              <p>Unlock the ${era.nextName} currency and its generators.</p>
              <p>Cost: ${format(era.nextCost)} ${era.name}</p>
              <button data-milestone="${era.id}"
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
  content.innerHTML = `
    <h2>Prestige</h2>
    <p>Prestige systems will become available as the universe grows.</p>
    <br>
    <div class="upgrade-card">
      <h3>Normal Prestige</h3>
      <p>Prestige count: ${game.prestigeCount}</p>
      <p>Permanent bonuses and a new progression layer are planned.</p>
      <button disabled>COMING SOON</button>
    </div>
    <div class="upgrade-card">
      <h3 style="color:#ef4444">EVIL PRESTIGE</h3>
      <p>Evil rewards. Much harder resets. Powerful new mechanics.</p>
      <p>Evil prestige count: ${game.evilPrestigeCount}</p>
      <button disabled>LOCKED</button>
    </div>
  `;
}

function renderStats(content) {
  content.innerHTML = `
    <h2>Statistics</h2>
    <p>Total clicks: ${format(game.totalClicks)}</p>
    <p>Unlocked eras: ${game.unlocked.length}/5</p>
    <p>Purchased upgrades: ${game.upgrades.length}</p>
    <p>Normal prestiges: ${game.prestigeCount}</p>
    <p>Evil prestiges: ${game.evilPrestigeCount}</p>
    <br>
    <h3>Lifetime Currency</h3>
    ${ERAS.map(era => `
      <p>${era.name}: ${format(game.lifetime[era.id] || 0)}</p>
    `).join("")}
  `;
}

function renderTab() {
  const content = document.getElementById("content");

  document.querySelectorAll("nav button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.tab === currentTab
    );
  });

  if (currentTab === "main") renderMain(content);
  if (currentTab === "generators") renderGenerators(content);
  if (currentTab === "upgrades") renderUpgrades(content);
  if (currentTab === "prestige") renderPrestige(content);
  if (currentTab === "stats") renderStats(content);
}

function updateUI() {
  renderCurrencyHeader();
  renderTab();
}

document.getElementById("generate").addEventListener(
  "click",
  generateEnergy
);

document.querySelectorAll("nav button").forEach(button => {
  button.addEventListener("click", () => {
    currentTab = button.dataset.tab;
    renderTab();
  });
});

loadGame();
updateUI();

setInterval(() => {
  ERAS.filter(era => game.unlocked.includes(era.id))
    .forEach(era => {
      const production = getProduction(era);

      if (production > 0) {
        earnCurrency(era.id, production);
      }
    });

  updateUI();
}, 1000);

setInterval(saveGame, 5000);

window.addEventListener("beforeunload", saveGame);
