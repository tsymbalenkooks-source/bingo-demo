const TOTAL_TICKETS = 3000;
const PREVIEW_LIMIT = 12;
const COLUMNS = [
    { letter: "B", min: 1, max: 15 },
    { letter: "I", min: 16, max: 30 },
    { letter: "N", min: 31, max: 45 },
    { letter: "G", min: 46, max: 60 },
    { letter: "O", min: 61, max: 75 }
];

const state = {
    tickets: [],
    selectedTickets: [],
    called: new Set(),
    currentPattern: "topRow",
    customPattern: makeEmptyPattern(),
    stopped: false,
    winners: []
};

const els = {
    gameStatus: document.querySelector("#gameStatus"),
    panelSelect: document.querySelector("#panelSelect"),
    rangeStart: document.querySelector("#rangeStart"),
    rangeEnd: document.querySelector("#rangeEnd"),
    loadRangeBtn: document.querySelector("#loadRangeBtn"),
    ticketSummary: document.querySelector("#ticketSummary"),
    patternGrid: document.querySelector("#patternGrid"),
    customBuilder: document.querySelector("#customBuilder"),
    manualNumber: document.querySelector("#manualNumber"),
    callBtn: document.querySelector("#callBtn"),
    resetBtn: document.querySelector("#resetBtn"),
    currentCall: document.querySelector("#currentCall"),
    calledCount: document.querySelector("#calledCount"),
    selectedCount: document.querySelector("#selectedCount"),
    winnerCount: document.querySelector("#winnerCount"),
    numberBoard: document.querySelector("#numberBoard"),
    winnerBanner: document.querySelector("#winnerBanner"),
    winnerTitle: document.querySelector("#winnerTitle"),
    winnerDetails: document.querySelector("#winnerDetails"),
    dismissWinnerBtn: document.querySelector("#dismissWinnerBtn"),
    ticketGrid: document.querySelector("#ticketGrid")
};

function makeEmptyPattern() {
    return Array.from({ length: 5 }, () => Array(5).fill(false));
}

function seededRandom(seed) {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => {
        value = value * 16807 % 2147483647;
        return (value - 1) / 2147483646;
    };
}

function generateTicket(id) {
    const random = seededRandom(id * 98317);
    const grid = Array.from({ length: 5 }, () => Array(5).fill(null));

    COLUMNS.forEach((column, columnIndex) => {
        const pool = Array.from(
            { length: column.max - column.min + 1 },
            (_, index) => column.min + index
        );

        for (let i = pool.length - 1; i > 0; i -= 1) {
            const j = Math.floor(random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        for (let row = 0; row < 5; row += 1) {
            grid[row][columnIndex] = pool[row];
        }
    });

    grid[2][2] = "FREE";
    return { id, grid };
}

function preloadTickets() {
    state.tickets = Array.from({ length: TOTAL_TICKETS }, (_, index) => generateTicket(index + 1));
}

function getPattern() {
    const pattern = makeEmptyPattern();

    if (state.currentPattern === "topRow") {
        pattern[0] = Array(5).fill(true);
    }

    if (state.currentPattern === "x") {
        for (let index = 0; index < 5; index += 1) {
            pattern[index][index] = true;
            pattern[index][4 - index] = true;
        }
    }

    if (state.currentPattern === "blackout") {
        return Array.from({ length: 5 }, () => Array(5).fill(true));
    }

    if (state.currentPattern === "custom") {
        return state.customPattern;
    }

    return pattern;
}

function isMarked(value) {
    return value === "FREE" || state.called.has(value);
}

function ticketMatches(ticket) {
    const pattern = getPattern();
    let hasRequirement = false;

    for (let row = 0; row < 5; row += 1) {
        for (let column = 0; column < 5; column += 1) {
            if (pattern[row][column]) {
                hasRequirement = true;
                if (!isMarked(ticket.grid[row][column])) {
                    return false;
                }
            }
        }
    }

    return hasRequirement;
}

function findWinners() {
    state.winners = state.selectedTickets.filter(ticketMatches);
    return state.winners;
}

function loadSelectedRange() {
    let start = Number(els.rangeStart.value);
    let end = Number(els.rangeEnd.value);

    start = Math.min(Math.max(start || 1, 1), TOTAL_TICKETS);
    end = Math.min(Math.max(end || start, 1), TOTAL_TICKETS);

    if (start > end) {
        [start, end] = [end, start];
    }

    els.rangeStart.value = start;
    els.rangeEnd.value = end;
    state.selectedTickets = state.tickets.slice(start - 1, end);
    state.called.clear();
    state.stopped = false;
    state.winners = [];
    els.winnerBanner.hidden = true;
    updateStatus("Game ready", "live");
    renderAll();
}

function callNumber(number) {
    if (state.stopped || !number || number < 1 || number > 75 || state.called.has(number)) {
        return;
    }

    state.called.add(number);
    els.currentCall.textContent = number;
    const winners = findWinners();

    if (winners.length > 0) {
        stopForWinner(winners);
    }

    els.manualNumber.value = "";
    renderAll();
}

function stopForWinner(winners) {
    state.stopped = true;
    updateStatus("Stopped on winner", "stopped");
    els.winnerTitle.textContent = `${winners.length} winning ticket${winners.length === 1 ? "" : "s"} found`;
    els.winnerDetails.textContent = `First match: Ticket #${winners[0].id}. Calls are stopped until reset or a new range is loaded.`;
    els.winnerBanner.hidden = false;
}

function resetGame() {
    state.called.clear();
    state.stopped = false;
    state.winners = [];
    els.currentCall.textContent = "--";
    els.winnerBanner.hidden = true;
    updateStatus(state.selectedTickets.length ? "Game ready" : "Setup required", state.selectedTickets.length ? "live" : "");
    renderAll();
}

function updateStatus(text, mode) {
    els.gameStatus.textContent = text;
    els.gameStatus.className = `status-pill ${mode || ""}`.trim();
}

function renderNumberBoard() {
    els.numberBoard.innerHTML = "";
    for (let number = 1; number <= 75; number += 1) {
        const button = document.createElement("button");
        button.className = `number-btn${state.called.has(number) ? " called" : ""}`;
        button.type = "button";
        button.textContent = number;
        button.disabled = state.stopped || state.called.has(number);
        button.addEventListener("click", () => callNumber(number));
        els.numberBoard.append(button);
    }
}

function renderPatternGrid() {
    els.patternGrid.innerHTML = "";
    const current = state.currentPattern === "custom" ? state.customPattern : getPattern();

    for (let row = 0; row < 5; row += 1) {
        for (let column = 0; column < 5; column += 1) {
            const button = document.createElement("button");
            button.className = `pattern-cell${current[row][column] ? " active" : ""}`;
            button.type = "button";
            button.ariaLabel = `Pattern row ${row + 1}, column ${column + 1}`;
            button.disabled = state.currentPattern !== "custom";
            button.addEventListener("click", () => {
                state.customPattern[row][column] = !state.customPattern[row][column];
                findWinners();
                renderAll();
            });
            els.patternGrid.append(button);
        }
    }
}

function renderTickets() {
    const pattern = getPattern();
    els.ticketGrid.innerHTML = "";
    const previewTickets = state.selectedTickets.slice(0, PREVIEW_LIMIT);
    const winnerIds = new Set(state.winners.map(ticket => ticket.id));

    previewTickets.forEach(ticket => {
        const card = document.createElement("article");
        card.className = `ticket-card${winnerIds.has(ticket.id) ? " winner" : ""}`;
        card.innerHTML = `
            <div class="ticket-head">
                <strong>Ticket #${ticket.id}</strong>
                <span class="match-label">${winnerIds.has(ticket.id) ? "Winner" : "Checking"}</span>
            </div>
            <div class="bingo-card">
                ${COLUMNS.map(column => `<div class="card-letter">${column.letter}</div>`).join("")}
                ${ticket.grid.flatMap((row, rowIndex) => row.map((value, columnIndex) => {
                    const marked = isMarked(value);
                    const required = pattern[rowIndex][columnIndex];
                    return `<div class="card-cell${marked ? " marked" : ""}${required ? " required" : ""}${value === "FREE" ? " free" : ""}">${value}</div>`;
                })).join("")}
            </div>
        `;
        els.ticketGrid.append(card);
    });

    if (previewTickets.length === 0) {
        els.ticketGrid.innerHTML = `<p class="quiet">Load a ticket range to begin validation.</p>`;
    }
}

function renderStats() {
    els.calledCount.textContent = state.called.size;
    els.selectedCount.textContent = state.selectedTickets.length.toLocaleString();
    els.winnerCount.textContent = state.winners.length;
    els.ticketSummary.textContent = `${state.selectedTickets.length.toLocaleString()} active tickets from ${TOTAL_TICKETS.toLocaleString()} preloaded tickets.`;
    els.callBtn.disabled = state.stopped;
}

function renderAll() {
    findWinners();
    renderStats();
    renderNumberBoard();
    renderPatternGrid();
    renderTickets();
}

document.querySelectorAll("[data-pattern]").forEach(button => {
    button.addEventListener("click", () => {
        state.currentPattern = button.dataset.pattern;
        document.querySelectorAll("[data-pattern]").forEach(item => {
            item.classList.toggle("active", item === button);
        });
        els.customBuilder.classList.toggle("visible", state.currentPattern === "custom");
        if (!state.stopped) {
            const winners = findWinners();
            if (winners.length > 0 && state.called.size > 0) {
                stopForWinner(winners);
            }
        }
        renderAll();
    });
});

els.loadRangeBtn.addEventListener("click", loadSelectedRange);
els.panelSelect.addEventListener("change", () => {
    const [start, end] = els.panelSelect.value.split("-").map(Number);
    els.rangeStart.value = start;
    els.rangeEnd.value = end;
    loadSelectedRange();
});
els.callBtn.addEventListener("click", () => callNumber(Number(els.manualNumber.value)));
els.manualNumber.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        callNumber(Number(els.manualNumber.value));
    }
});
els.resetBtn.addEventListener("click", resetGame);
els.dismissWinnerBtn.addEventListener("click", () => {
    els.winnerBanner.hidden = true;
});

preloadTickets();
renderNumberBoard();
renderPatternGrid();
renderTickets();
loadSelectedRange();
