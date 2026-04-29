const STORAGE_KEY = "lustLoopsPlayers";
const LEVELS = ["Soft", "Hot", "Hard", "Extreme"];
const SPIN_DURATION = 1500;
const TIMER_SECONDS = 120;

const defaultPlayers = {
    player1: { name: "Spelare 1", gender: "male" },
    player2: { name: "Spelare 2", gender: "female" },
    preferences: {
        anal: true,
        bi: true,
        spanking: true,
        bdsm: true
    }
};

const state = {
    content: [],
    level: 0,
    activePlayerId: 1,
    spinning: false,
    usedIds: {
        question: new Set(),
        dare: new Set()
    },
    timerId: null,
    timerRemaining: TIMER_SECONDS
};

const view = {
    backBtn: document.getElementById("backBtn"),
    startBtn: document.getElementById("startBtn"),
    levelScreen: document.getElementById("levelScreen"),
    gameScreen: document.getElementById("gameScreen"),
    levelList: document.getElementById("levelList"),
    turnLabel: document.getElementById("turnLabel"),
    levelKicker: document.getElementById("levelKicker"),
    gameCard: document.querySelector(".game-card-shell"),
    spinStage: document.getElementById("spinStage"),
    goBtn: document.getElementById("goBtn"),
    truthBtn: document.getElementById("truthBtn"),
    dareBtn: document.getElementById("dareBtn"),
    welcomePlayerOne: document.getElementById("welcomePlayerOne"),
    welcomePlayerTwo: document.getElementById("welcomePlayerTwo"),
    playerOneName: document.getElementById("playerOneName"),
    playerTwoName: document.getElementById("playerTwoName"),
    taskModal: document.getElementById("taskModal"),
    taskCard: document.getElementById("taskCard"),
    taskLead: document.getElementById("taskLead"),
    taskLevel: document.getElementById("taskLevel"),
    taskTitle: document.getElementById("taskTitle"),
    taskText: document.getElementById("taskText"),
    timerPanel: document.getElementById("timerPanel"),
    timer: document.getElementById("timer"),
    doneBtn: document.getElementById("doneBtn")
};

function loadPlayers() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        return {
            ...defaultPlayers,
            ...stored,
            player1: { ...defaultPlayers.player1, ...stored.player1 },
            player2: { ...defaultPlayers.player2, ...stored.player2 },
            preferences: { ...defaultPlayers.preferences, ...stored.preferences }
        };
    } catch {
        return defaultPlayers;
    }
}

const players = loadPlayers();

function trimName(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
}

function getPlayer(id) {
    return id === 2
        ? { id: 2, ...players.player2, name: trimName(players.player2.name) || "Spelare 2" }
        : { id: 1, ...players.player1, name: trimName(players.player1.name) || "Spelare 1" };
}

function getActorPair() {
    const actor = getPlayer(state.activePlayerId);
    const target = getPlayer(state.activePlayerId === 1 ? 2 : 1);
    return { actor, target };
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

function getPlayerAccent(player) {
    return player.id === 1 ? "#00e5ff" : "#ff007f";
}

function swedishGenitive(name) {
    const cleanName = trimName(name);
    return /s$/i.test(cleanName) ? cleanName : `${cleanName}s`;
}

function playerMarkup(player, suffix = "") {
    return `<span class="task-player-name" style="--player-accent:${getPlayerAccent(player)};">${escapeHtml(player.name)}${suffix}</span>`;
}

function formatTask(text, actor, target) {
    const actorGenitive = swedishGenitive(actor.name).slice(actor.name.length);
    const targetGenitive = swedishGenitive(target.name).slice(target.name.length);

    return escapeHtml(text)
        .replace(/\$ACTOR(?:&#39;|['’])s|\$ACTORS|\$ACTORs/g, playerMarkup(actor, actorGenitive))
        .replace(/\$TARGET(?:&#39;|['’])s|\$TARGETS|\$TARGETs/g, playerMarkup(target, targetGenitive))
        .replace(/\$ACTOR/g, playerMarkup(actor))
        .replace(/\$TARGET/g, playerMarkup(target));
}

function matchesGender(required, player) {
    return !required || required === "any" || required === player.gender;
}

function getPreferenceKey(tag) {
    return tag === "smisk" ? "spanking" : tag;
}

function matchesPreferences(item) {
    return (item.tags || []).every((tag) => players.preferences?.[getPreferenceKey(tag)] !== false);
}

function getItemType(item) {
    if (item.subType === "question" || item.type === "truth") return "question";
    if (item.subType === "dare" || item.type === "dare") return "dare";
    return "any";
}

function getFilteredItems(kind) {
    const { actor, target } = getActorPair();
    const strict = state.content.filter((item) =>
        getItemType(item) === kind &&
        Array.isArray(item.intensities) &&
        typeof item.intensities[state.level] === "string" &&
        matchesGender(item.actor, actor) &&
        matchesGender(item.target, target) &&
        matchesPreferences(item)
    );

    if (strict.length || kind === "question") return strict;

    return state.content.filter((item) =>
        Array.isArray(item.intensities) &&
        typeof item.intensities[state.level] === "string" &&
        matchesGender(item.actor, actor) &&
        matchesGender(item.target, target) &&
        matchesPreferences(item)
    );
}

function pickTask(kind) {
    const items = getFilteredItems(kind);
    if (!items.length) return null;

    let pool = items.filter((item) => !state.usedIds[kind].has(item.id));
    if (!pool.length) {
        state.usedIds[kind].clear();
        pool = items;
    }

    const item = pool[Math.floor(Math.random() * pool.length)];
    state.usedIds[kind].add(item.id);
    return item;
}

function setScreen(screen) {
    view.levelScreen.classList.toggle("is-active", screen === "level");
    view.gameScreen.classList.toggle("is-active", screen === "game");
}

function updateLevelButtons() {
    view.levelList.querySelectorAll("[data-level]").forEach((button) => {
        button.classList.toggle("is-active", Number(button.dataset.level) === state.level);
    });
    view.levelKicker.textContent = `Nivå ${state.level + 1} av 4`;
}

function applyGameAccent(player) {
    if (!view.gameCard) return;
    view.gameCard.style.setProperty("--challenge-accent", player.id === 1 ? "rgba(0,229,255,0.38)" : "rgba(255,0,127,0.38)");
    view.gameCard.style.setProperty("--challenge-accent-glow", player.id === 1 ? "rgba(0,229,255,0.34)" : "rgba(255,0,127,0.34)");
}

function setChoicesEnabled(enabled) {
    view.truthBtn.disabled = !enabled;
    view.dareBtn.disabled = !enabled;
}

function updateNames() {
    view.welcomePlayerOne.textContent = getPlayer(1).name;
    view.welcomePlayerTwo.textContent = getPlayer(2).name;
    view.playerOneName.textContent = getPlayer(1).name;
    view.playerTwoName.textContent = getPlayer(2).name;
}

function updateTurnLabel(hasSelection = false) {
    if (!hasSelection) {
        view.turnLabel.innerHTML = `<span class="task-lead-label">${LEVELS[state.level]}</span><span class="task-lead-separator">-</span><span>Tryck GO</span>`;
        return;
    }

    const { actor } = getActorPair();
    view.turnLabel.innerHTML = `${playerMarkup(actor, swedishGenitive(actor.name).slice(actor.name.length))}<span class="task-lead-separator">-</span><span>välj något</span>`;
}

function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
}

function setCoinTransform(rotation, tilt = 0) {
    view.spinStage.style.setProperty("--coin-rotation", `${rotation}deg`);
    view.spinStage.style.setProperty("--coin-tilt", `${tilt}deg`);
}

function spinPlayers() {
    if (state.spinning) return;

    state.spinning = true;
    setChoicesEnabled(false);
    view.goBtn.disabled = true;
    view.turnLabel.textContent = "Väljer...";

    const nextActiveId = Math.random() < 0.5 ? 1 : 2;
    const finalAngle = nextActiveId === 1 ? 0 : 180;
    const rounds = 8 + Math.floor(Math.random() * 3);
    const startAngle = Number.parseFloat(view.spinStage.style.getPropertyValue("--coin-rotation")) || 0;
    const targetAngle = (Math.floor(startAngle / 360) + rounds) * 360 + finalAngle;
    const startTime = performance.now();

    function animate(now) {
        const progress = Math.min((now - startTime) / SPIN_DURATION, 1);
        const eased = easeOutCubic(progress);
        const flutter = Math.sin(progress * Math.PI * 6) * 18 * (1 - progress);
        setCoinTransform(startAngle + (targetAngle - startAngle) * eased, flutter);

        if (progress < 1) {
            requestAnimationFrame(animate);
            return;
        }

        state.activePlayerId = nextActiveId;
        setCoinTransform(finalAngle, 0);
        state.spinning = false;
        view.goBtn.disabled = false;
        setChoicesEnabled(true);
        applyGameAccent(getPlayer(nextActiveId));
        updateTurnLabel(true);
    }

    requestAnimationFrame(animate);
}

function openTask(kind) {
    const item = pickTask(kind);
    const { actor, target } = getActorPair();
    const accent = getPlayerAccent(actor);
    const typeLabel = kind === "question" ? "Lockelse" : "Lust";

    view.taskCard.style.setProperty("--challenge-accent", actor.id === 1 ? "rgba(0,229,255,0.38)" : "rgba(255,0,127,0.38)");
    view.taskCard.style.setProperty("--challenge-accent-glow", actor.id === 1 ? "rgba(0,229,255,0.34)" : "rgba(255,0,127,0.34)");
    view.taskCard.style.setProperty("--player-accent", accent);
    view.taskLead.innerHTML = `${playerMarkup(actor)}<span class="task-lead-separator">-</span><span class="task-lead-label">${typeLabel}</span>`;
    view.taskLevel.textContent = `Nivå ${state.level + 1} av 4`;

    if (!item) {
        stopTimer(true);
        view.taskLead.innerHTML = `${playerMarkup(actor)}<span class="task-lead-separator">-</span><span class="task-lead-label">Tomt urval</span>`;
        view.taskTitle.textContent = "Inget hittades";
        view.taskText.textContent = "Justera nivå eller preferenser för att få fler kort.";
        applyTaskTextSizing(view.taskText.textContent);
        view.timerPanel.hidden = true;
    } else {
        view.taskTitle.textContent = item.title || (kind === "question" ? "Lockelse" : "Lust");
        view.taskText.innerHTML = formatTask(item.intensities[state.level], actor, target);
        applyTaskTextSizing(item.intensities[state.level]);
        if (kind === "dare") startTimer();
        else stopTimer(true);
    }

    view.taskModal.classList.add("is-open");
    view.taskModal.setAttribute("aria-hidden", "false");
}

function applyTaskTextSizing(text) {
    const length = String(text).replace(/\s+/g, " ").trim().length;
    view.taskText.classList.remove("size-medium", "size-small", "size-xsmall");

    if (length >= 210) {
        view.taskText.classList.add("size-xsmall");
        return;
    }

    if (length >= 165) {
        view.taskText.classList.add("size-small");
        return;
    }

    if (length >= 125) {
        view.taskText.classList.add("size-medium");
    }
}

function stopTimer(reset = false) {
    if (state.timerId) {
        window.clearInterval(state.timerId);
        state.timerId = null;
    }
    if (reset) {
        state.timerRemaining = TIMER_SECONDS;
        view.timer.textContent = "02:00";
        view.timerPanel.hidden = true;
    }
}

function startTimer() {
    stopTimer();
    state.timerRemaining = TIMER_SECONDS;
    view.timerPanel.hidden = false;
    renderTimer();
    state.timerId = window.setInterval(() => {
        state.timerRemaining = Math.max(0, state.timerRemaining - 1);
        renderTimer();
        if (state.timerRemaining === 0) stopTimer();
    }, 1000);
}

function renderTimer() {
    const minutes = String(Math.floor(state.timerRemaining / 60)).padStart(2, "0");
    const seconds = String(state.timerRemaining % 60).padStart(2, "0");
    view.timer.textContent = `${minutes}:${seconds}`;
}

function closeTask() {
    view.taskModal.classList.remove("is-open");
    view.taskModal.setAttribute("aria-hidden", "true");
    stopTimer(true);
    setChoicesEnabled(false);
    updateTurnLabel(false);
    window.setTimeout(spinPlayers, 260);
}

async function loadContent() {
    const response = await fetch("./content.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load content.json (${response.status})`);
    state.content = await response.json();
}

function bindEvents() {
    view.backBtn.addEventListener("click", () => {
        window.location.href = "../../index.html?fade=1";
    });

    view.levelList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-level]");
        if (!button) return;
        state.level = Number(button.dataset.level);
        updateLevelButtons();
    });

    view.startBtn.addEventListener("click", () => {
        setScreen("game");
        updateLevelButtons();
        updateTurnLabel(false);
    });

    view.goBtn.addEventListener("click", spinPlayers);
    view.truthBtn.addEventListener("click", () => openTask("question"));
    view.dareBtn.addEventListener("click", () => openTask("dare"));
    view.doneBtn.addEventListener("click", closeTask);
}

async function init() {
    updateNames();
    updateLevelButtons();
    applyGameAccent(getPlayer(state.activePlayerId));
    setCoinTransform(state.activePlayerId === 1 ? 0 : 180, 0);
    bindEvents();
    setChoicesEnabled(false);
    try {
        await loadContent();
    } catch {
        view.levelList.innerHTML = `
            <div class="level-btn" role="status">
                <span>Innehåll saknas</span>
                <small>Kunde inte läsa content.json.</small>
            </div>
        `;
    }
}

init();
