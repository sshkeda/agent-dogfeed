# agent-dogfeed

An agent skill and CLI for dogfooding agent-facing CLIs, tools, and skills through a fresh Codex or Claude Code subagent.

`agent-dogfeed` is for questions such as:

- Can a fresh agent correctly operate this CLI after a change?
- Does a long-running command expose enough progress for an agent to wait correctly?
- Does a skill lead another agent through the intended real workflow?
- What mistakes show up in the transcript after an agent uses the program?

## Skill

The skill source is:

```txt
skills/agent-dogfeed/SKILL.md
```

It keeps the dogfeed loop small: write a raw prompt, run an isolated fresh
agent, read the transcript, and fix what the run exposes.

## CLI

The package exposes an `agent-dogfeed` CLI:

```bash
agent-dogfeed --help
```

Generate a fresh probe command from a raw prompt:

```bash
agent-dogfeed codex --repo /absolute/path/to/repo --prompt '<raw prompt>'
agent-dogfeed claude --repo /absolute/path/to/repo --prompt '<raw prompt>'
```

Both subcommands print the probe command for review. They do not rewrite or
template the prompt.

Codex probes are isolated by default. The generated command creates a temporary
auth-only `CODEX_HOME`, exports it for the child process, and runs with
`--ignore-user-config`, `--ignore-rules`, `--ephemeral`, and
`--sandbox workspace-write`. Your user skills, plugins, rules, config, and
session state are not inherited.

Claude probes are isolated by default. The generated command creates a
temporary blank `CLAUDE_CONFIG_DIR` (no auth copy is needed: Claude Code reads
credentials from the system keychain) and runs `claude -p` with
`--no-session-persistence`, `--strict-mcp-config`, and
`--permission-mode bypassPermissions`. The probe emits its full transcript as
stream-json so the parent agent can read every tool call, not just the final
claim. Unlike Codex, Claude Code has no OS sandbox flag, so point probes at
disposable repos or worktrees when the prompt can mutate state.

When the probe needs a skill, link only that skill into the isolated state:

```bash
agent-dogfeed codex --repo /absolute/path/to/repo --skill agent-cli --prompt '<raw prompt>'
agent-dogfeed claude --repo /absolute/path/to/repo --skill agent-cli --prompt '<raw prompt>'
```

Use `--user-codex`/`--user-claude` only when intentionally testing inherited
user config or tools.

## Terminal Evidence

For non-interactive CLI output-channel and ordering checks, use the bundled capture harness:

```bash
agent-dogfeed capture --output /tmp/agent-dogfeed-proof.jsonl -- <command> [args...]
```

The harness records stdout/stderr chunks and process exit as JSONL. The parent
validator should read the proof file directly and remove it after reporting. It
is not appropriate for behavior that depends on a TTY.

The bundled fixture provides a harmless self-test:

```bash
agent-dogfeed capture --output /tmp/agent-dogfeed-proof.jsonl -- skills/agent-dogfeed/scripts/terminal-contract-fixture.sh
```

## Development

Run the smoke test:

```bash
npm test
```

The test runs the bundled fixture through the capture harness and verifies the recorded process exit.

CI runs the same smoke test on every push and pull request.

## License

MIT
