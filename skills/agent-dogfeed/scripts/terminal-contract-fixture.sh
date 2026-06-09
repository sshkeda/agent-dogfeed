#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' '{"event":"agent_dogfeed_fixture_progress","phase":"waiting"}' >&2
sleep "${AGENT_DOGFEED_FIXTURE_DELAY_SECONDS:-1}"
printf '%s\n' '{"event":"agent_dogfeed_fixture_progress","phase":"done"}' >&2
printf '%s\n' 'FIXTURE_OK'
