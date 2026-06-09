---
name: agent-dogfeed
description: Use when dogfooding an agent-facing CLI, tool, or skill with an isolated fresh Codex or Claude Code agent, then reading the transcript to find mistakes to fix.
---

# Agent Dogfeed

Use an isolated fresh agent to test the real program. Read the transcript. Fix the mistakes the test exposes.

## Loop

1. Build or link the program the agent should test.
2. Write the raw prompt for the fresh agent yourself.
3. Decide which skills the fresh agent needs and pass each one with `--skill <name-or-path>`.
4. Start the isolated probe with `agent-dogfeed codex --repo <path> --skill <needed-skill> --prompt '<raw prompt>'` or `agent-dogfeed claude ...` with the same options.
5. Read the probe output. Look for wrong commands/cwd, confusion, missing or misleading progress, bad stdout/stderr behavior, unclear IDs, bad errors/exit codes, unproven claims, hidden state coupling, lifecycle mistakes, unsafe side effects, artifact problems, or harness-only success.
6. Fix the program, docs, or skill instructions.
7. Re-run only the smallest probe that proves the fix.

Probe with the harness the skill or tool actually targets. When it targets
both, probe with both: the two agents fail differently.

## Commands

Generate a fresh-agent command from your raw prompt:

```bash
agent-dogfeed codex --repo /absolute/path/to/repo --prompt '<raw prompt>'
agent-dogfeed claude --repo /absolute/path/to/repo --prompt '<raw prompt>'
```

The Codex probe is isolated by default: temporary auth-only `CODEX_HOME`, no
user config, no user rules, ephemeral session, and approvals/sandbox bypassed
so keychain-backed tools work.

The Claude probe is isolated by default: temporary `CLAUDE_CONFIG_DIR` seeded
only with the keychain OAuth credential, no session persistence, no MCP
servers, and `--permission-mode bypassPermissions`. It prints the full
transcript as stream-json.

Neither probe runs in an OS sandbox: point probes at disposable repos or
worktrees when the prompt can mutate state.

Add only the required skills to that isolated environment:

```bash
agent-dogfeed codex --repo /absolute/path/to/repo --skill agent-cli --prompt '<raw prompt>'
agent-dogfeed claude --repo /absolute/path/to/repo --skill agent-cli --prompt '<raw prompt>'
```

Use `--user-codex`/`--user-claude` only when the test is specifically about
inherited user config, plugins, or tools.

Capture exact stdout/stderr ordering for a non-interactive target command:

```bash
agent-dogfeed capture --output /tmp/agent-dogfeed-proof.jsonl -- <target-command> [args...]
```

Read the proof file directly to validate the contract, then remove it after
reporting.

## Rules

- Test the real installed or linked capability, not a mock, unless the user asks for a mock.
- Keep the prompt short enough that the fresh agent has room to interpret the task.
- For live or costly commands, require one invocation unless retry behavior is under test.
- Do not call the test passed just because the subagent says it passed; verify output, exit status, files, logs, or external state.
- Keep secrets out of prompts and copied logs.
