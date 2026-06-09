const defaultModel = "gpt-5.4-mini";

export function buildCodexExecArgs({
  repo,
  prompt,
  model = defaultModel,
  isolated = true,
}) {
  const args = [
    "exec",
    "-m",
    model,
    "--color",
    "never",
  ];

  if (isolated) {
    args.push(
      "--ignore-user-config",
      "--ignore-rules",
      "--ephemeral",
      "--sandbox",
      "workspace-write",
    );
  }

  args.push(
    "-C",
    repo,
    prompt,
  );

  return args;
}

export function renderShellCommand(command, args) {
  return [command, ...args].map(shellQuote).join(" ");
}

export function renderIsolatedCodexShellCommand(args, skills = []) {
  const setup = [
    'CODEX_HOME="$(mktemp -d "${TMPDIR:-/tmp}/agent-dogfeed-codex-home.XXXXXX")"',
    "export CODEX_HOME",
    'trap \'rm -rf "$CODEX_HOME"\' EXIT',
    'install -m 600 "$HOME/.codex/auth.json" "$CODEX_HOME/auth.json"',
  ];

  if (skills.length > 0) {
    setup.push('mkdir -p "$CODEX_HOME/skills"');
  }

  for (const skill of skills) {
    setup.push(renderSkillLinkCommand(skill));
  }

  return [
    ...setup,
    renderShellCommand("codex", args),
  ].join("; ");
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_./:=@%+-]+$/.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", "'\\''")}'`;
}

function renderSkillLinkCommand(skill) {
  if (skill.includes("/") || skill.startsWith(".")) {
    return `ln -s ${shellQuote(skill)} "$CODEX_HOME/skills/$(basename ${shellQuote(skill)})"`;
  }

  return `ln -s "$HOME/.codex/skills/${skill}" "$CODEX_HOME/skills/${skill}"`;
}
