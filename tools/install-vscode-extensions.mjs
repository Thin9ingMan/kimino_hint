import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import readline from "node:readline";

function isLikelyVsCodeTerminal(env) {
  // NOTE: Not officially guaranteed, but commonly present for VS Code integrated terminal.
  return (
    env.TERM_PROGRAM === "vscode" ||
    Boolean(env.VSCODE_PID) ||
    Boolean(env.VSCODE_IPC_HOOK_CLI)
  );
}

function readExtensionsList() {
  // 1) Explicit override
  if (process.env.VSCODE_EXTENSIONS?.trim()) {
    return process.env.VSCODE_EXTENSIONS.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // 2) Repo-managed list
  const listPath = "./tools/vscode-extensions.txt";
  if (existsSync(listPath)) {
    return readFileSync(listPath, "utf8")
      .split(/\r?\n/g)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("#"));
  }

  // 3) Default list (keep minimal)
  return ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"];
}

function pickCodeCli() {
  const candidates = [
    // Stable
    "code",
    // Insiders
    "code-insiders",
  ];

  for (const cmd of candidates) {
    const r = spawnSync(cmd, ["--version"], { stdio: "ignore" });
    if (r.status === 0) return cmd;
  }

  return null;
}

async function confirmInstall(extensions) {
  // Explicit opt-out
  if (process.env.VSCODE_EXTENSIONS_DENY === "1") return false;

  // Explicit opt-in (useful for automation)
  if (process.env.VSCODE_EXTENSIONS_CONSENT === "1") return true;
  if (process.argv.includes("--yes")) return true;

  // Avoid hanging in non-interactive contexts (CI / redirected stdin)
  if (process.env.CI === "true" || process.env.CI === "1") return false;
  if (!process.stdin.isTTY) return false;

  // eslint-disable-next-line no-console
  console.log(
    "[vscode-ext] This project can install the following VS Code extensions:",
  );
  for (const ext of extensions) {
    // eslint-disable-next-line no-console
    console.log(`  - ${ext}`);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const normalize = (s) =>
    String(s ?? "")
      .trim()
      .toLowerCase();

  while (true) {
    const answer = await new Promise((resolve) => {
      rl.question("[vscode-ext] Install them now? [Y/n] ", resolve);
    });

    const v = normalize(answer);

    // Allow: empty (default Yes), y, yes
    if (v === "" || v === "y" || v === "yes") {
      rl.close();
      return true;
    }

    // Allow: n, no => skip
    if (v === "n" || v === "no") {
      rl.close();
      return false;
    }

    // Any other input: ask again.
    // eslint-disable-next-line no-console
    console.log("[vscode-ext] Please answer with empty, y, yes, n, or no.");
  }
}

function installExtensions(codeCli, extensions) {
  for (const ext of extensions) {
    // --force: reinstall/upgrade if already installed.
    const r = spawnSync(codeCli, ["--install-extension", ext, "--force"], {
      stdio: "inherit",
    });

    // Don’t break npm install; treat extension install as best-effort.
    if (r.status !== 0) {
      // eslint-disable-next-line no-console
      console.warn(`[vscode-ext] failed to install: ${ext}`);
    }
  }
}

try {
  if (!isLikelyVsCodeTerminal(process.env)) {
    process.exit(0);
  }

  const extensions = readExtensionsList();
  if (extensions.length === 0) process.exit(0);

  const codeCli = pickCodeCli();
  if (!codeCli) {
    // eslint-disable-next-line no-console
    console.warn(
      "[vscode-ext] VS Code CLI (code) not found in PATH; skipping extension install.",
    );
    process.exit(0);
  }

  const ok = await confirmInstall(extensions);
  if (!ok) process.exit(0);

  installExtensions(codeCli, extensions);
  process.exit(0);
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn("[vscode-ext] unexpected error; skipping extension install.", e);
  process.exit(0);
}
