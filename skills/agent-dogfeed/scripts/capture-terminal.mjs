#!/usr/bin/env node

import { runCaptureTerminalCli } from "../../../lib/capture-terminal.mjs";

process.exitCode = await runCaptureTerminalCli(process.argv.slice(2));
