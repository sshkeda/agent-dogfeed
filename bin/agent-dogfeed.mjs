#!/usr/bin/env node

import { runCaptureTerminalCli } from "../lib/capture-terminal.mjs";
import {
  buildCodexExecArgs,
  renderIsolatedCodexShellCommand,
  renderShellCommand,
} from "../lib/probes.mjs";

const argv = process.argv.slice(2);
const command = argv[0];
const programName = "agent-dogfeed";

switch (command) {
  case "capture": {
    process.exitCode = await runCaptureTerminalCli(argv.slice(1), {
      programName: "agent-dogfeed capture",
    });
    break;
  }

  case "codex": {
    process.exitCode = await runCodex(argv.slice(1));
    break;
  }

  case "help":
  case "--help":
  case "-h":
  case undefined: {
    process.stdout.write(usage());
    process.exitCode = command ? 0 : 2;
    break;
  }

  default: {
    process.stderr.write(usage());
    process.exitCode = 2;
  }
}

async function runCodex(args) {
  const parsed = parseOptions(args);

  if (parsed.error) {
    process.stderr.write(`${parsed.error}\n\n${usage()}`);
    return 2;
  }

  const { options } = parsed;
  if (!options.repo) {
    process.stderr.write(`missing required --repo\n\n${usage()}`);
    return 2;
  }

  if (!options.prompt) {
    process.stderr.write(`missing required --prompt\n\n${usage()}`);
    return 2;
  }

  const codexArgs = buildCodexExecArgs({
    repo: options.repo,
    model: options.model,
    prompt: options.prompt,
    isolated: options.isolated,
  });

  const command = options.isolated
    ? renderIsolatedCodexShellCommand(codexArgs, options.skills)
    : renderShellCommand("codex", codexArgs);
  process.stdout.write(`${command}\n`);
  return 0;
}

function parseOptions(args) {
  const allowedOptions = new Set([
    "model",
    "prompt",
    "repo",
    "skill",
  ]);
  const booleanOptions = new Set([
    "blank_codex",
    "user_codex",
  ]);
  const options = {
    isolated: true,
    model: "gpt-5.4-mini",
    skills: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("--")) {
      return { error: `unexpected argument: ${arg}` };
    }

    const key = arg.slice(2).replaceAll("-", "_");
    if (booleanOptions.has(key)) {
      if (key === "user_codex") {
        options.isolated = false;
      } else if (key === "blank_codex") {
        options.isolated = true;
      }
      continue;
    }

    if (!allowedOptions.has(key)) {
      return { error: `unknown option: ${arg}` };
    }

    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      return { error: `missing value for ${arg}` };
    }
    if (key === "skill") {
      if (!isValidSkillValue(next)) {
        return { error: `invalid --skill value: ${next}` };
      }
      options.skills.push(next);
    } else {
      options[key] = next;
    }
    index += 1;
  }

  return { options };
}

function isValidSkillValue(value) {
  return value.includes("/") || value.startsWith(".") || /^[A-Za-z0-9._-]+$/.test(value);
}

function usage() {
  return `usage:
  ${programName} capture [--output <path>] -- <command> [args...]
  ${programName} codex --repo <path> --prompt <raw-prompt> [--model <model>] [--skill <name-or-path>] [--user-codex]

codex prints the codex exec command for review without rewriting the prompt.
codex probes are isolated by default: a temporary auth-only CODEX_HOME,
--ignore-user-config, --ignore-rules, --ephemeral, and --sandbox workspace-write.
Use --skill for each required skill to link into the isolated CODEX_HOME.
Use --user-codex only when intentionally testing inherited user config/tools.
`;
}
