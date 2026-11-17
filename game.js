
const SAVE_KEY = "exponent_save_v1";

const defaultSave = {
  energy: 0,
  lifetimeEnergy: 0,
  generators: 0,
  generatorCost: 10,
  generatorPower: 1,
  multiplier: 1,
  upgrades: [],
  totalClicks: 0,
  prestigeCount: 0
};

let game = { ...defaultSave };
let currentTab = "main";

function format(num) {
  if (num < 1000) return Math.floor(num).toString();

  const suffixes = ["K", "M", "B", "T", "Qa", "Qi"];
  let tier = -1;

  while (num >= 1000 && tier < suffixes.length - 1) {
    num /= 1000;
    tier++;
  }

  if (num >= 1000) {
    return num.toExponential(2);
  }

  return num.toFixed(2) + suffixes[tier];
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(game));
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));

    if (saved) {
      game = { ...defaultSave, ...saved };
    }
  } catch (error) {
    console.log("Save could not be loaded.");
  }
}

function earnEnergy(amount) {
  game.energy += amount;
  game.lifetimeEnergy += amount;
  updateUI();
}

function generateEnergy() {
  earnEnergy(1 * game.multiplier);
  game.totalClicks++;
  saveGame();
}

function buyGenerator() {
  if (game.energy < game.generatorCost) return;

  game.energy -= game.generatorCost;
  game.generators++;

  game.generatorCost = Math.ceil(
    game.generatorCost * 1.15
  );

  updateUI();
  saveGame();
}

function buyUpgrade(id, cost, multiplier) {
  if (game.upgrades.includes(id)) return;
  if (game.energy < cost) return;

  game.energy -= cost;
  game.upgrades.push(id);
  game.multiplier *= multiplier;

  updateUI();
  saveGame();
}

function getProduction() {
  return game.generators *
    game.generatorPower *
    game.multiplier;
}

function updateUI() {
  document.getElementById("energy").textContent =
    format(game.energy);

  document.getElementById("production").textContent =
    "+" + format(getProduction()) + " / second";

  renderTab();
}

function renderTab() {
  const content = document.getElementById("content");

  document.querySelectorAll("nav button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.tab === currentTab
    );
  });

  if (currentTab === "main") {
    content.innerHTML = `
      <h2>Energy Core</h2>
      <p>Your universe begins with a single unit of energy.</p>
      <br>
      <p>Lifetime energy: <b>${format(game.lifetimeEnergy)}</b></p>
      <p>Total clicks: <b>${format(game.totalClicks)}</b></p>
    `;
  }

  if (currentTab === "generators") {
    content.innerHTML = `
      <h2>Generators</h2>
      <p>Owned: ${game.generators}</p>
      <br>
      <div class="upgrade-card">
        <h3>Energy Generator</h3>
        <p>Produces 1 energy per second.</p>
        <p>Cost: ${format(game.generatorCost)} Energy</p>
        <button id="buyGenerator"
          ${game.energy < game.generatorCost ? "disabled" : ""}>
          BUY GENERATOR
        </button>
      </div>
    `;

    document.getElementById("buyGenerator")
      .addEventListener("click", buyGenerator);
  }

  if (currentTab === "upgrades") {
    content.innerHTML = `
      <h2>Upgrades</h2>
      <p>Improve your energy production.</p>
      <br>

      <div class="upgrade-card">
        <h3>Enhanced Output</h3>
        <p>Doubles all energy production.</p>
        <p>Cost: 50 Energy</p>
        <button id="upgrade1"
          ${game.energy < 50 || game.upgrades.includes("output") ? "disabled" : ""}>
          ${game.upgrades.includes("output") ? "PURCHASED" : "BUY UPGRADE"}
        </button>
      </div>

      <br>

      <div class="upgrade-card">
        <h3>Energy Optimization</h3>
        <p>Triples all energy production.</p>
        <p>Cost: 500 Energy</p>
        <button id="upgrade2"
          ${game.energy < 500 || game.upgrades.includes("optimization") ? "disabled" : ""}>
          ${game.upgrades.includes("optimization") ? "PURCHASED" : "BUY UPGRADE"}
        </button>
      </div>
    `;

    document.getElementById("upgrade1")
      .addEventListener("click", () =>
        buyUpgrade("output", 50, 2)
      );

    document.getElementById("upgrade2")
      .addEventListener("click", () =>
        buyUpgrade("optimization", 500, 3)
      );
  }

  if (currentTab === "prestige") {
    content.innerHTML = `
      <h2>Prestige</h2>
      <p>Prestige systems are coming soon.</p>
      <br>
      <p>Prestige count: ${game.prestigeCount}</p>
      <p>Build your universe before ascending.</p>
    `;
  }

  if (currentTab === "stats") {
    content.innerHTML = `
      <h2>Statistics</h2>
      <p>Lifetime energy: ${format(game.lifetimeEnergy)}</p>
      <p>Generators owned: ${game.generators}</p>
      <p>Energy multiplier: x${format(game.multiplier)}</p>
      <p>Total clicks: ${game.totalClicks}</p>
    `;
  }
}

document.getElementById("generate")
  .addEventListener("click", generateEnergy);

document.querySelectorAll("nav button").forEach(button => {
  button.addEventListener("click", () => {
    currentTab = button.dataset.tab;
    updateUI();
  });
});

loadGame();
updateUI();

setInterval(() => {
  const production = getProduction();

  if (production > 0) {
    earnEnergy(production);
  }
}, 1000);

setInterval(saveGame, 5000);
