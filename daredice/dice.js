const STORAGE_KEY = "lustLoopsDarediceCategory";
const PLAYER_STORAGE_KEY = "lustLoopsPlayers";

const CATEGORIES = {
    vanilj: {
        label: "Vanilj",
        actions: [
            "$ACTOR, ge mjuka heta kyssar på $TARGETS...",
            "$ACTOR, nafsa och kyss $TARGET över...",
            "$ACTOR, smek med lätta fingrar över $TARGETS...",
            "$ACTOR, håll din mun nära och andas varmt mot $TARGETS...",
            "$ACTOR, massera med fasta grepp $TARGETS...",
            "$ACTOR, smek med dina fuktade läppar över $TARGETS...",
            "$ACTOR, utforska med tungan längs $TARGETS...",
            "$ACTOR, smeka med dröjande händer över $TARGETS..."
        ],
        targets: [
            "nacke och axlar.",
            "insida av låren.",
            "svank och rygg.",
            "öra och hals.",
            "valfria ställen på kroppen.",
            "ljumskar.",
            "mage och ner mot könet.",
            "kön.",
            "skinkor."
        ]
    },
    bdsm: {
        label: "BDSM",
        actions: [
            "$ACTOR, bit försiktigt men bestämt i $TARGETS...",
            "$ACTOR, fixera $TARGETS händer och nafsa på...",
            "$ACTOR, ge lätta men värmande smisk på $TARGETS...",
            "$ACTOR, dra naglarna med ett krävande tryck över $TARGETS...",
            "$ACTOR, använd en ögonbindel på $TARGET och överraska...",
            "$ACTOR, tejpa eller bind fast $TARGETS händer och kyss...",
            "$ACTOR, styr $TARGETS huvud och kräv kyssar på...",
            "$ACTOR, massera en valfri sexleksak mot $TARGETS...",
            "$ACTOR, smek $TARGET med ett redskap över...",
            "$ACTOR, nafsa och sug hårt på $TARGETS..."
        ],
        targets: [
            "nacke och axlar.",
            "bröstkorg och bröstvårtor.",
            "skinkor.",
            "insida av låren.",
            "valfria ställen på kroppen.",
            "mage och ner mot könet.",
            "kön.",
            "insida av handlederna.",
            "ländrygg.",
            "ljumskar."
        ]
    },
    bi: {
        label: "BI-fantasi",
        actions: [
            "$ACTOR, använd en dildo eller leksak för att leka med $TARGETS...",
            "$ACTOR, spegla $TARGETS rörelser när hen på sig själv smeker...",
            "$ACTOR, lyssna på $TARGETS andning när du masserar...",
            "$ACTOR, använd dina fingrar och massera långsamt $TARGETS...",
            "$ACTOR, kyss, slicka och nafsa $TARGET - på eller nära...",
            "$ACTOR, massera $TARGET med en dildo över...",
            "$ACTOR, använd ditt eget kön för att massera $TARGETS...",
            "$ACTOR, guidas av $TARGETS ord när du på hen rör...",
            "$ACTOR, gör det du tror $TARGET uppskattar mot...",
            "$ACTOR, låt $TARGET använda händer/leksak på sig själv medan du kysser..."
        ],
        targets: [
            "anus och området runt omkring.",
            "bröstvårtor och bröst.",
            "insida av låren och ljumskarna.",
            "mellangård och bakåt.",
            "kön (eller en sexleksak som simulerar ett kön).",
            "området runt en valfri kroppsöppning.",
            "mun och läppar.",
            "punkten där hen är som mest känslig.",
            "ansikte och hals.",
            "valfritt ställe på kroppen."
        ]
    },
    smisk: {
        label: "Smisk",
        actions: [
            "$ACTOR, ge ett rappt och värmande smisk på $TARGETS...",
            "$ACTOR, värm upp huden med lätta, snabba smisk från din hand över $TARGETS...",
            "$ACTOR, använd en flogger för att piska lätt mot $TARGETS...",
            "$ACTOR, använd en padel eller hårborste för att piska lätt mot $TARGETS...",
            "$ACTOR, massera och smek ömt $TARGETS...",
            "$ACTOR, nyp lätt i huden vid $TARGETS...",
            "$ACTOR, använd din handflata för att skapa en högljud klatch mot $TARGETS...",
            "$ACTOR, varva lätta drag med en flogger och ömma kyssar över $TARGETS...",
            "$ACTOR, låt $TARGET bestämma styrkan av smisk med valfritt redskap, med 'hårdare' eller 'lösare', mot...",
            "$ACTOR, öka intensiteten gradvis när du smiskar $TARGETS..."
        ],
        targets: [
            "skinkor.",
            "insida av låren.",
            "ljumskar och höfter.",
            "ställen där huden är som rödast.",
            "svank och övre delen av rumpan.",
            "område som du väljer.",
            "skinkornas nedre del.",
            "bröstkorg.",
            "handflator."
        ]
    }
};

const state = {
    categoryKey: localStorage.getItem(STORAGE_KEY) || "vanilj",
    rolling: false,
    actorId: 1,
    currentAction: "Rulla",
    currentTarget: "Tärning"
};

const players = {
    player1: { id: 1, name: "Spelare 1" },
    player2: { id: 2, name: "Spelare 2" }
};

const view = {
    categoryGrid: document.getElementById("categoryGrid"),
    actionDie: document.getElementById("actionDie"),
    targetDie: document.getElementById("targetDie"),
    actionValue: document.getElementById("actionValue"),
    targetValue: document.getElementById("targetValue"),
    rollBtn: document.getElementById("rollBtn"),
    backBtn: document.getElementById("backBtn")
};

function loadPlayers() {
    try {
        const stored = JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY) || "{}");
        if (stored.player1?.name) players.player1.name = stored.player1.name.trim() || players.player1.name;
        if (stored.player2?.name) players.player2.name = stored.player2.name.trim() || players.player2.name;
    } catch {}
}

function getCategory() {
    return CATEGORIES[state.categoryKey] || CATEGORIES.vanilj;
}

function getActorPair() {
    const actor = state.actorId === 2 ? players.player2 : players.player1;
    const target = state.actorId === 2 ? players.player1 : players.player2;
    return { actor, target };
}

function advanceActor() {
    state.actorId = state.actorId === 1 ? 2 : 1;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function playerMarkup(player, suffix = "") {
    const className = player.id === 1 ? "player-name player-one" : "player-name player-two";
    return `<span class="${className}">${escapeHtml(player.name)}${suffix}</span>`;
}

function formatAction(text, actor, target) {
    const actorName = playerMarkup(actor);
    const targetName = playerMarkup(target);
    const actorPossessive = playerMarkup(actor, "s");
    const targetPossessive = playerMarkup(target, "s");

    return escapeHtml(text)
        .replace(/\$ACTOR_POSSESSIVE/g, actorPossessive)
        .replace(/\$TARGET_POSSESSIVE/g, targetPossessive)
        .replace(/\$ACTORs/g, actorPossessive)
        .replace(/\$TARGETs/g, targetPossessive)
        .replace(/\$ACTORS/g, actorPossessive)
        .replace(/\$TARGETS/g, targetPossessive)
        .replace(/\$ACTOR/g, actorName)
        .replace(/\$TARGET/g, targetName);
}

function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function getRollCategory() {
    if (state.categoryKey !== "mix") return getCategory();
    return pickRandom(Object.values(CATEGORIES));
}

function renderCategories() {
    const categories = [
        ...Object.entries(CATEGORIES),
        ["mix", { label: "Mixa allt" }]
    ];

    view.categoryGrid.innerHTML = categories
        .map(([key, category]) => `
            <button class="category-btn ${key === state.categoryKey ? "is-active" : ""}" type="button" data-category="${key}">
                ${category.label}
            </button>
        `)
        .join("");
}

function setCategory(key) {
    if (key !== "mix" && !CATEGORIES[key]) return;
    state.categoryKey = key;
    localStorage.setItem(STORAGE_KEY, key);
    renderCategories();
}

function setDiceValues(action, target) {
    state.currentAction = action;
    state.currentTarget = target;
    view.actionValue.innerHTML = action;
    view.targetValue.textContent = target;
}

function setRolling(isRolling) {
    state.rolling = isRolling;
    view.rollBtn.disabled = isRolling;
    view.actionDie.disabled = isRolling;
    view.targetDie.disabled = isRolling;
    view.actionDie.classList.toggle("is-rolling", isRolling);
    view.targetDie.classList.toggle("is-rolling", isRolling);
}

function rollDice() {
    if (state.rolling) return;

    const category = getRollCategory();
    const { actor, target } = getActorPair();
    const nextAction = formatAction(pickRandom(category.actions), actor, target);
    const nextTarget = pickRandom(category.targets);

    setRolling(true);

    window.setTimeout(() => {
        setDiceValues(nextAction, nextTarget);
        setRolling(false);
        advanceActor();
    }, 620);
}

function goBack() {
    window.location.href = "../index.html?fade=1";
}

function init() {
    loadPlayers();

    if (state.categoryKey !== "mix" && !CATEGORIES[state.categoryKey]) {
        state.categoryKey = "vanilj";
    }

    renderCategories();
    setDiceValues(state.currentAction, state.currentTarget);

    view.categoryGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-category]");
        if (!button) return;
        setCategory(button.dataset.category);
    });

    view.rollBtn.addEventListener("click", rollDice);
    view.actionDie.addEventListener("click", rollDice);
    view.targetDie.addEventListener("click", rollDice);
    view.backBtn.addEventListener("click", goBack);
}

init();
