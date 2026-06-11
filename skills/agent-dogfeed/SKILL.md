---
name: agent-dogfeed
description: Dogfood any feature, product, CLI, skill, or code change by running fresh isolated agents against it and mining their transcripts — use agent-env/agent-box to build the environment, spawn subagent probes, then lac to read what the agent actually experienced. Use when you want to know how an agent behaves with something, whether a fresh agent can operate a tool after a change, or what friction a skill/CLI/doc creates.
---

# Agent Dogfeed

Dogfeeding = learning how agents actually experience a thing by watching
fresh ones use it. You (the orchestrator) build an isolated environment,
spawn a subagent into it with a raw prompt, then mine its transcript. The
transcript is the product feedback; the subagent's self-report is not.

## The loop

1. **Build or link the real thing** the agent should use — never a mock
   unless explicitly asked.
2. **Choose the environment tool:**
   - `agent-env` — isolated CLI sessions (Claude Code, Codex): fresh
     auth-seeded config, hand-picked skills, optional Docker sandbox.
     See the agent-env skill for all setup options.
   - `agent-box` — isolated worktrees/boxed environments when the test
     needs its own copy of a codebase, dev server, or test run.
3. **Write the raw prompt yourself** — short enough that the fresh agent
   has room to interpret; what it misunderstands is data.
4. **Spawn the subagent:**
   - one-shot: `agent-env probe <codex|claude> --repo <path> --prompt '...'
     [--skill <name>]...` renders the command; run it.
   - interactive: `agent-env up <cli> --repo <path>` when the test needs a
     session you poke at.
   - in-harness: the Agent/Task tool with a fresh agent works too when you
     want parallel probes — but it inherits harness context; prefer
     agent-env isolation when measuring a cold start.
   - probe with the harness the target actually serves; if it serves both
     claude and codex, probe BOTH — they fail differently.
5. **Mine the transcript with lac.** Probes print
   "agent-env: session saved in <dir>" on stderr; run `lac <dir>/*.jsonl`
   for the digest (timeline, tool ledger, errors, token growth) and
   `lac view <file> --event <id>` to expand spans.
6. **Hunt for experience failures:** wrong commands/cwd, confusion loops,
   missing or misleading progress, bad stdout/stderr behavior, unclear
   IDs, bad errors/exit codes, unproven claims, hidden state coupling,
   lifecycle mistakes, unsafe side effects, harness-only success.
7. **Fix** the program, docs, or skill — then re-run the **smallest probe
   that proves the fix**.

## Rules

- The subagent saying it succeeded is not evidence — verify output, exit
  status, files, logs, or external state.
- For live or costly commands, allow one invocation unless retry behavior
  is itself under test.
- Keep secrets out of prompts and copied logs.
- Point isolated agents at disposable repos/worktrees when the prompt can
  mutate state (host-mode agent-env isolation protects config, not the
  system; use `--sandbox docker` for true OS isolation).
- Report findings as agent-experience observations ("the agent retried X
  three times because the error never named the flag"), not just bug
  lists — the orchestrator's job is understanding behavior.
