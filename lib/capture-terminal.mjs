import { spawn } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

export function captureUsage(programName = "capture-terminal.mjs") {
  return `usage: ${programName} [--output <path>] -- <command> [args...]\n`;
}

export async function runCaptureTerminalCli(argv, options = {}) {
  const {
    stdout = process.stdout,
    stderr = process.stderr,
    programName = "capture-terminal.mjs",
  } = options;

  const separator = argv.indexOf("--");
  const command = separator >= 0 ? argv.slice(separator + 1) : [];
  const cliOptions = separator >= 0 ? argv.slice(0, separator) : argv;
  let outputPath;

  for (let index = 0; index < cliOptions.length; index += 1) {
    if (cliOptions[index] === "--output" && cliOptions[index + 1]) {
      outputPath = cliOptions[index + 1];
      index += 1;
      continue;
    }

    stderr.write(captureUsage(programName));
    return 2;
  }

  if (command.length === 0) {
    stderr.write(captureUsage(programName));
    return 2;
  }

  return captureTerminal(command, { outputPath, stdout });
}

export async function captureTerminal(command, options = {}) {
  const { outputPath, stdout = process.stdout } = options;
  const startedAt = performance.now();
  let sequence = 0;

  if (outputPath) {
    writeFileSync(outputPath, "", { mode: 0o600 });
  }

  function emit(event) {
    const line = `${JSON.stringify(event)}\n`;
    stdout.write(line);
    if (outputPath) {
      appendFileSync(outputPath, line);
    }
  }

  function elapsedMs() {
    return Math.round(performance.now() - startedAt);
  }

  emit({
    event: "terminal_probe_start",
    command: command[0],
    arg_count: command.length - 1,
  });

  return new Promise((resolve) => {
    const child = spawn(command[0], command.slice(1), {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let spawnFailed = false;

    for (const stream of ["stdout", "stderr"]) {
      child[stream].on("data", (chunk) => {
        emit({
          event: "terminal_probe_chunk",
          sequence: ++sequence,
          stream,
          elapsed_ms: elapsedMs(),
          text: chunk.toString("utf8"),
        });
      });
    }

    child.once("error", (error) => {
      spawnFailed = true;
      emit({
        event: "terminal_probe_error",
        elapsed_ms: elapsedMs(),
        message: error.message,
      });
    });

    child.once("close", (code, signal) => {
      const resolvedCode = spawnFailed ? 127 : (code ?? 1);
      emit({
        event: "terminal_probe_exit",
        elapsed_ms: elapsedMs(),
        code: resolvedCode,
        signal,
      });
      resolve(resolvedCode);
    });
  });
}
