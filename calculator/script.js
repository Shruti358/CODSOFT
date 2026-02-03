const displayEl = document.querySelector("[data-display]");
const historyEl = document.querySelector("[data-history]");
const keysEl = document.querySelector(".keys");

/**
 * State (classic 2-operand calculator)
 * - current: string shown on display (being typed)
 * - previous: number stored when an operator is chosen
 * - operator: "+", "-", "*", "/" or null
 * - resetOnNextDigit: after equals/operator compute, next digit starts fresh
 */
const state = {
  current: "0",
  previous: null,
  operator: null,
  resetOnNextDigit: false,
};

function formatForDisplay(value) {
  // Keep it simple: avoid huge long floats on screen
  if (!Number.isFinite(value)) return "Error";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-9)) return value.toExponential(8);
  // Trim floating point noise
  const s = String(value);
  if (!s.includes(".")) return s;
  return String(parseFloat(s));
}

function updateUI() {
  displayEl.textContent = state.current;
  if (state.previous === null || !state.operator) {
    historyEl.textContent = "";
  } else {
    historyEl.textContent = `${formatForDisplay(state.previous)} ${symbolForOp(
      state.operator
    )}`;
  }
}

function symbolForOp(op) {
  if (op === "/") return "÷";
  if (op === "*") return "×";
  if (op === "-") return "−";
  return "+";
}

function inputDigit(d) {
  if (state.current === "Error") {
    state.current = "0";
    state.previous = null;
    state.operator = null;
  }

  if (state.resetOnNextDigit) {
    state.current = d;
    state.resetOnNextDigit = false;
    updateUI();
    return;
  }

  if (state.current === "0") state.current = d;
  else state.current += d;
  updateUI();
}

function inputDecimal() {
  if (state.current === "Error") return;
  if (state.resetOnNextDigit) {
    state.current = "0.";
    state.resetOnNextDigit = false;
    updateUI();
    return;
  }
  if (!state.current.includes(".")) state.current += ".";
  updateUI();
}

function clearAll() {
  state.current = "0";
  state.previous = null;
  state.operator = null;
  state.resetOnNextDigit = false;
  updateUI();
}

function deleteOne() {
  if (state.current === "Error") {
    clearAll();
    return;
  }
  if (state.resetOnNextDigit) return;
  if (state.current.length <= 1 || (state.current.length === 2 && state.current.startsWith("-"))) {
    state.current = "0";
  } else {
    state.current = state.current.slice(0, -1);
  }
  updateUI();
}

function toggleSign() {
  if (state.current === "Error") return;
  if (state.current === "0") return;
  if (state.current.startsWith("-")) state.current = state.current.slice(1);
  else state.current = `-${state.current}`;
  updateUI();
}

function percent() {
  if (state.current === "Error") return;
  const x = Number(state.current);
  if (!Number.isFinite(x)) return;
  state.current = formatForDisplay(x / 100);
  updateUI();
}

function compute(a, op, b) {
  // if-else + operators as requested
  if (op === "+") return a + b;
  else if (op === "-") return a - b;
  else if (op === "*") return a * b;
  else if (op === "/") return b === 0 ? NaN : a / b;
  return b;
}

function setOperator(op) {
  if (state.current === "Error") return;

  const currentNum = Number(state.current);
  if (!Number.isFinite(currentNum)) return;

  // If there is a pending operation and user already typed next number, compute first
  if (state.operator && state.previous !== null && !state.resetOnNextDigit) {
    const result = compute(state.previous, state.operator, currentNum);
    state.previous = result;
    state.current = formatForDisplay(result);
  } else if (state.previous === null) {
    state.previous = currentNum;
  }

  state.operator = op;
  state.resetOnNextDigit = true;
  updateUI();
}

function equals() {
  if (state.current === "Error") return;
  if (!state.operator || state.previous === null) return;

  const b = Number(state.current);
  if (!Number.isFinite(b)) return;

  const result = compute(state.previous, state.operator, b);
  state.current = formatForDisplay(result);
  state.previous = null;
  state.operator = null;
  state.resetOnNextDigit = true;
  updateUI();
}

function handleAction(action) {
  if (action === "clear") clearAll();
  else if (action === "delete") deleteOne();
  else if (action === "equals") equals();
  else if (action === "decimal") inputDecimal();
  else if (action === "toggleSign") toggleSign();
  else if (action === "percent") percent();
}

function handleKeyPress(key) {
  // Digits
  if (key >= "0" && key <= "9") {
    inputDigit(key);
    return;
  }

  // Operators
  if (key === "+" || key === "-" || key === "*" || key === "/") {
    setOperator(key);
    return;
  }

  if (key === ".") {
    inputDecimal();
    return;
  }

  if (key === "Enter" || key === "=") {
    equals();
    return;
  }

  if (key === "Backspace") {
    deleteOne();
    return;
  }

  if (key === "Escape") {
    clearAll();
  }
}

// Clicks (event delegation over the grid; loops used via event bubbling + repeated presses)
keysEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const digit = btn.getAttribute("data-digit");
  const op = btn.getAttribute("data-op");
  const action = btn.getAttribute("data-action");

  if (digit !== null) inputDigit(digit);
  else if (op) setOperator(op);
  else if (action) handleAction(action);
});

// Keyboard
window.addEventListener("keydown", (e) => {
  handleKeyPress(e.key);
});

updateUI();

