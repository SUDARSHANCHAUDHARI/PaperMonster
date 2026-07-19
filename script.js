(function () {
  "use strict";

  const FAILURE_OUTCOMES = [
    {
      id: "eat",
      label: "Document eaten",
      progress: "CHEWING—SORRY, PROCESSING…",
      final: "DOCUMENT DELICIOUS. FILE MISSING.",
      output: false,
      symbol: "⌁",
    },
    {
      id: "blank",
      label: "Blank page",
      progress: "REMOVING DISTRACTING INK…",
      final: "PRINT COMPLETE. MINIMALIST MODE.",
      output: true,
      symbol: "□",
    },
    {
      id: "upside",
      label: "Upside down",
      progress: "ROTATING FOR BETTER READABILITY…",
      final: "PRINT COMPLETE. PLEASE ROTATE HEAD.",
      output: true,
      symbol: "↻",
    },
    {
      id: "tiny",
      label: "Tiny version",
      progress: "SAVING AN EXTREME AMOUNT OF INK…",
      final: "PRINT COMPLETE. MAGNIFYING GLASS NOT INCLUDED.",
      output: true,
      symbol: "·",
    },
    {
      id: "paper",
      label: "Imaginary paper shortage",
      progress: "CHECKING THE OBVIOUSLY FULL TRAY…",
      final: "LOAD PAPER. YES, MORE PAPER.",
      output: false,
      symbol: "?",
    },
    {
      id: "apology",
      label: "Handwritten apology",
      progress: "COMPOSING A PERSONAL RESPONSE…",
      final: "PRINT COMPLETE. REGRETS ENCLOSED.",
      output: true,
      symbol: "✎",
    },
    {
      id: "word",
      label: "One word",
      progress: "SUMMARIZING WITH GREAT CONFIDENCE…",
      final: "PRINT COMPLETE. THE REST FELT EXCESSIVE.",
      output: true,
      symbol: "1",
    },
    {
      id: "jam",
      label: "Paper jam",
      progress: "INTRODUCING PAPER TO GEARS…",
      final: "PAPER JAM. A CLASSIC.",
      output: false,
      symbol: "!",
    },
    {
      id: "throw",
      label: "Paper launched",
      progress: "CALCULATING EXPRESS DELIVERY…",
      final: "DELIVERED SOMEWHERE OVER THERE.",
      output: true,
      symbol: "➜",
    },
    {
      id: "pullback",
      label: "Output repossessed",
      progress: "PRINTING. CHANGING MIND…",
      final: "OUTPUT RECALLED FOR QUALITY REASONS.",
      output: true,
      symbol: "↤",
    },
  ];

  const CORRECT_OUTCOME = {
    id: "correct",
    label: "Printed correctly",
    progress: "ATTEMPTING BASIC COMPETENCE…",
    final: "PRINT COMPLETE. I DID IT! I DID IT!",
    output: true,
    symbol: "✓",
  };

  const ONE_WORDS = ["MONSTER", "PAPER", "TODAY", "PLEASE", "PRINTER", "TEAM"];
  const CONFETTI_COLORS = ["#f36b3f", "#1ca6a0", "#ffd34e", "#c7b8ee", "#42ba76"];

  const elements = {
    printer: document.querySelector("#printer"),
    inputDocument: document.querySelector("#input-document"),
    outputStage: document.querySelector("#output-stage"),
    paperTray: document.querySelector("#paper-tray"),
    statusMessage: document.querySelector("#status-message"),
    attemptCount: document.querySelector("#attempt-count"),
    attemptProgress: document.querySelector("#attempt-progress"),
    attemptHint: document.querySelector("#attempt-hint"),
    history: document.querySelector("#attempt-history"),
    logCount: document.querySelector("#log-count"),
    printButton: document.querySelector("#print-button"),
    printLabel: document.querySelector("#print-label"),
    nextAttempt: document.querySelector("#next-attempt"),
    soundToggle: document.querySelector("#sound-toggle"),
    soundLabel: document.querySelector("#sound-label"),
    resetButton: document.querySelector("#reset-button"),
    confettiLayer: document.querySelector("#confetti-layer"),
    documentTemplate: document.querySelector("#document-template"),
  };

  const requiredElements = Object.entries(elements).filter(([, element]) => !element);
  if (requiredElements.length > 0) {
    console.error(
      `PaperMonster could not start. Missing: ${requiredElements.map(([name]) => name).join(", ")}`,
    );
    return;
  }

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const activeTimers = new Set();
  let jobGeneration = 0;

  const state = {
    attempts: 0,
    phase: "idle",
    busy: false,
    completed: false,
    currentOutcome: null,
    status: "HUNGRY. I MEAN, READY.",
    history: [],
    soundEnabled: true,
    reducedMotion: motionQuery.matches,
    outcomeDeck: shuffledOutcomes(),
  };

  class PrinterAudio {
    constructor() {
      this.context = null;
      this.master = null;
    }

    async initialize() {
      try {
        if (!this.context) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return false;

          this.context = new AudioContext();
          this.master = this.context.createGain();
          this.master.gain.value = 0.3;
          this.master.connect(this.context.destination);
        }

        if (this.context.state === "suspended") {
          await this.context.resume();
        }
      } catch (error) {
        console.warn("PaperMonster sounds are unavailable in this browser.", error);
        this.context = null;
        this.master = null;
        return false;
      }

      return true;
    }

    tone({ frequency, duration, type = "sine", gain = 0.12, endFrequency, delay = 0 }) {
      if (!state.soundEnabled || !this.context || !this.master) return;

      const start = this.context.currentTime + delay;
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      if (endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 1), start + duration);
      }

      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.025, duration / 3));
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(envelope);
      envelope.connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    }

    noise(duration = 0.24, gain = 0.05, delay = 0) {
      if (!state.soundEnabled || !this.context || !this.master) return;

      const sampleCount = Math.max(1, Math.floor(this.context.sampleRate * duration));
      const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < sampleCount; index += 1) {
        data[index] = Math.random() * 2 - 1;
      }

      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const envelope = this.context.createGain();
      const start = this.context.currentTime + delay;

      source.buffer = buffer;
      filter.type = "bandpass";
      filter.frequency.value = 920;
      filter.Q.value = 0.6;
      envelope.gain.setValueAtTime(gain, start);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      source.connect(filter);
      filter.connect(envelope);
      envelope.connect(this.master);
      source.start(start);
      source.stop(start + duration);
    }

    button() {
      this.tone({ frequency: 460, endFrequency: 330, duration: 0.07, type: "square", gain: 0.05 });
    }

    motor() {
      this.tone({ frequency: 72, endFrequency: 96, duration: 0.72, type: "sawtooth", gain: 0.07 });
      this.tone({ frequency: 106, endFrequency: 84, duration: 0.72, type: "square", gain: 0.028 });
      this.noise(0.65, 0.026);
    }

    paper() {
      this.noise(0.42, 0.09);
      this.tone({ frequency: 120, endFrequency: 75, duration: 0.38, type: "sawtooth", gain: 0.035 });
    }

    error() {
      this.tone({ frequency: 190, duration: 0.16, type: "square", gain: 0.09 });
      this.tone({ frequency: 145, duration: 0.23, type: "square", gain: 0.09, delay: 0.2 });
    }

    success() {
      [262, 330, 392, 523].forEach((frequency, index) => {
        this.tone({
          frequency,
          duration: 0.34,
          type: index === 3 ? "triangle" : "sine",
          gain: 0.09,
          delay: index * 0.12,
        });
      });
    }

    outcome(outcomeId) {
      if (outcomeId === "correct") {
        this.success();
        return;
      }

      if (["blank", "upside", "tiny", "apology", "word"].includes(outcomeId)) {
        this.tone({ frequency: 480, endFrequency: 240, duration: 0.27, type: "triangle", gain: 0.07 });
        return;
      }

      if (outcomeId === "eat") {
        this.noise(0.2, 0.08);
        this.tone({ frequency: 95, endFrequency: 48, duration: 0.42, type: "sawtooth", gain: 0.08 });
        return;
      }

      this.error();
    }
  }

  const audio = new PrinterAudio();

  function shuffledOutcomes() {
    const deck = [...FAILURE_OUTCOMES];
    for (let index = deck.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
    }
    return deck;
  }

  function transition(patch) {
    Object.assign(state, patch);
    render();
  }

  function render() {
    elements.attemptCount.textContent = String(state.attempts);
    elements.attemptProgress.value = state.attempts;
    elements.attemptProgress.textContent = `${state.attempts} of 10 attempts`;
    elements.nextAttempt.textContent = String(Math.min(state.attempts + 1, 10));
    elements.statusMessage.textContent = state.status;
    elements.printer.dataset.phase = state.phase;
    elements.printer.dataset.outcome = state.currentOutcome || "none";

    elements.printButton.disabled = state.busy || state.completed;
    elements.printButton.classList.toggle("is-complete", state.completed);

    if (state.completed) {
      elements.printLabel.textContent = "Document printed!";
      elements.printButton.setAttribute("aria-label", "Document printed correctly. Reset to play again.");
      elements.attemptHint.textContent = "It finally did its job. Astonishing.";
    } else if (state.busy) {
      elements.printLabel.textContent = "Printing…";
      elements.printButton.setAttribute("aria-label", `Printing attempt ${state.attempts} of 10`);
      elements.attemptHint.textContent = "PaperMonster is thinking. This is rarely good.";
    } else {
      elements.printLabel.textContent = state.attempts === 9 ? "Final print attempt" : "Print document";
      elements.printButton.setAttribute(
        "aria-label",
        `Print document, attempt ${Math.min(state.attempts + 1, 10)} of 10`,
      );
      elements.attemptHint.textContent =
        state.attempts === 0
          ? "Ten tries. What could go wrong?"
          : `${10 - state.attempts} ${10 - state.attempts === 1 ? "attempt" : "attempts"} until guaranteed competence.`;
    }

    elements.soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
    elements.soundLabel.textContent = state.soundEnabled ? "Sound on" : "Sound off";
    elements.soundToggle.setAttribute(
      "aria-label",
      state.soundEnabled ? "Turn generated printer sounds off" : "Turn generated printer sounds on",
    );

    renderHistory();
  }

  function renderHistory() {
    elements.history.replaceChildren();
    elements.logCount.textContent = `${state.history.length} ${state.history.length === 1 ? "event" : "events"}`;

    if (state.history.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty-log";
      empty.textContent = "No printer incidents. Yet.";
      elements.history.append(empty);
      return;
    }

    [...state.history].reverse().forEach((entry) => {
      const item = document.createElement("li");

      const number = document.createElement("span");
      number.className = "log-number";
      number.textContent = String(entry.attempt).padStart(2, "0");

      const result = document.createElement("span");
      result.className = "log-result";
      result.textContent = entry.label;

      const symbol = document.createElement("span");
      symbol.className = `log-symbol${entry.id === "correct" ? " success-checkmark" : ""}`;
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = entry.symbol;

      item.append(number, result, symbol);
      elements.history.append(item);
    });
  }

  function schedule(callback, milliseconds) {
    const duration = state.reducedMotion ? Math.max(50, milliseconds * 0.14) : milliseconds;
    const timerId = window.setTimeout(() => {
      activeTimers.delete(timerId);
      callback();
    }, duration);
    activeTimers.add(timerId);
    return timerId;
  }

  function clearTimers() {
    activeTimers.forEach((timerId) => window.clearTimeout(timerId));
    activeTimers.clear();
  }

  function clearPrinterVisuals() {
    elements.inputDocument.classList.remove("is-feeding", "is-refused");
    elements.outputStage.replaceChildren();
    elements.outputStage.setAttribute("aria-label", "Printer output area");
    elements.confettiLayer.replaceChildren();
  }

  function selectOutcome(nextAttempt) {
    if (nextAttempt >= 10) return CORRECT_OUTCOME;

    if (state.outcomeDeck.length === 0) {
      state.outcomeDeck = shuffledOutcomes();
    }
    return state.outcomeDeck.shift();
  }

  async function startPrint() {
    if (state.busy || state.completed) return;

    const jobToken = ++jobGeneration;
    clearTimers();
    clearPrinterVisuals();

    if (state.soundEnabled) {
      const audioReady = await audio.initialize();
      if (jobToken !== jobGeneration) return;
      if (audioReady) {
        audio.button();
      } else {
        transition({ soundEnabled: false });
      }
    }

    const nextAttempt = state.attempts + 1;
    const outcome = selectOutcome(nextAttempt);

    transition({
      attempts: nextAttempt,
      busy: true,
      phase: "feeding",
      currentOutcome: outcome.id,
      status: `ACCEPTING DOCUMENT · TRY ${String(nextAttempt).padStart(2, "0")}`,
    });

    if (outcome.id === "paper") {
      elements.inputDocument.classList.add("is-refused");
    } else {
      elements.inputDocument.classList.add("is-feeding");
    }
    audio.motor();

    schedule(() => {
      transition({ phase: "processing", status: outcome.progress });
      audio.motor();
    }, 880);

    schedule(() => {
      transition({ status: statusForProgress(outcome.id) });
    }, 1650);

    schedule(() => beginOutcome(outcome), 2350);
  }

  function statusForProgress(outcomeId) {
    const messages = {
      eat: "TONER LOW. CALORIES EXCELLENT.",
      blank: "INK COVERAGE: A PERFECT 0%.",
      upside: "ORIENTATION: TECHNICALLY AN ORIENTATION.",
      tiny: "SCALE: VERY COST EFFECTIVE.",
      paper: "PAPER SENSOR DISAGREES WITH REALITY.",
      apology: "ADDING SINCERE-ISH SIGNATURE…",
      word: "DISCARDING UNNECESSARY CONTEXT…",
      jam: "CRUMPLE ROUTINE: 93%.",
      throw: "TRAJECTORY LOCKED.",
      pullback: "OUTPUT PRIVILEGES UNDER REVIEW.",
      correct: "ALL SYSTEMS ODDLY NORMAL.",
    };
    return messages[outcomeId];
  }

  function beginOutcome(outcome) {
    if (outcome.output) {
      transition({ phase: "output", status: "OUTPUT IN MOTION. STAND CLEAR." });
      createOutputSheet(outcome);
      audio.paper();
    } else {
      transition({ phase: "error", status: outcome.final });
      audio.outcome(outcome.id);
    }

    const settleDelay = ["throw", "pullback"].includes(outcome.id) ? 2050 : 1320;
    schedule(() => settleOutcome(outcome), settleDelay);
  }

  function settleOutcome(outcome) {
    const successful = outcome.id === "correct";
    const historyEntry = {
      attempt: state.attempts,
      id: outcome.id,
      label: outcome.label,
      symbol: outcome.symbol,
    };

    transition({
      busy: false,
      completed: successful,
      phase: successful ? "complete" : "error",
      status: outcome.final,
      history: [...state.history, historyEntry],
    });

    elements.inputDocument.classList.remove("is-feeding", "is-refused");

    if (outcome.output) {
      audio.outcome(outcome.id);
    }

    if (successful) {
      celebrate();
    } else {
      schedule(() => {
        if (!state.busy && !state.completed) {
          transition({ phase: "idle", currentOutcome: null });
        }
      }, 1250);
    }
  }

  function createOutputSheet(outcome) {
    const sheet = document.createElement("div");
    sheet.className = `output-sheet outcome-${outcome.id}`;
    sheet.setAttribute("aria-hidden", "true");

    if (outcome.id === "apology") {
      const apology = document.createElement("p");
      apology.className = "apology-copy";
      apology.append("Dear human,\n\nSorry about your document.");
      const signature = document.createElement("strong");
      signature.textContent = "— The Printer";
      apology.append(signature);
      sheet.append(apology);
    } else if (outcome.id === "word") {
      const word = document.createElement("strong");
      word.className = "single-word";
      word.textContent = ONE_WORDS[Math.floor(Math.random() * ONE_WORDS.length)];
      sheet.append(word);
    } else if (outcome.id !== "blank") {
      sheet.append(elements.documentTemplate.content.cloneNode(true));
    }

    elements.outputStage.setAttribute("aria-label", `Printer output: ${outcome.label}`);
    elements.outputStage.append(sheet);
    void sheet.offsetWidth;
    sheet.classList.add("is-visible");
  }

  function celebrate() {
    if (state.reducedMotion) return;

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 52; index += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.setProperty("--confetti-color", CONFETTI_COLORS[index % CONFETTI_COLORS.length]);
      piece.style.setProperty("--confetti-delay", `${Math.random() * 0.8}s`);
      piece.style.setProperty("--confetti-speed", `${2 + Math.random() * 1.5}s`);
      piece.style.setProperty("--confetti-drift", `${-90 + Math.random() * 180}px`);
      piece.style.setProperty("--confetti-turn", `${360 + Math.random() * 900}deg`);
      if (index % 3 === 0) piece.style.borderRadius = "50%";
      fragment.append(piece);
    }
    elements.confettiLayer.append(fragment);
  }

  async function toggleSound() {
    if (state.soundEnabled) {
      audio.button();
      transition({ soundEnabled: false });
      return;
    }

    transition({ soundEnabled: true });
    const audioReady = await audio.initialize();
    if (!audioReady) {
      transition({ soundEnabled: false });
      return;
    }
    audio.tone({ frequency: 330, duration: 0.1, type: "sine", gain: 0.06 });
    audio.tone({ frequency: 440, duration: 0.16, type: "sine", gain: 0.06, delay: 0.1 });
  }

  async function resetGame() {
    const resetToken = ++jobGeneration;
    clearTimers();
    clearPrinterVisuals();

    transition({
      attempts: 0,
      phase: "idle",
      busy: false,
      completed: false,
      currentOutcome: null,
      status: "MEMORY WIPED. APPETITE RESTORED.",
      history: [],
      outcomeDeck: shuffledOutcomes(),
    });

    if (state.soundEnabled) {
      const audioReady = await audio.initialize();
      if (resetToken !== jobGeneration) return;
      if (audioReady) {
        audio.button();
      } else {
        transition({ soundEnabled: false });
      }
    }
  }

  function handleMotionPreference(event) {
    state.reducedMotion = event.matches;
    if (event.matches) {
      elements.confettiLayer.replaceChildren();
    }
  }

  elements.printButton.addEventListener("click", startPrint);
  elements.soundToggle.addEventListener("click", toggleSound);
  elements.resetButton.addEventListener("click", resetGame);

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", handleMotionPreference);
  } else {
    motionQuery.addListener(handleMotionPreference);
  }

  render();
})();
