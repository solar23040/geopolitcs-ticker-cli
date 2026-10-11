#!/usr/bin/env node
import React from "react";
import { Command } from "commander";
import { render } from "ink";
import chalk from "chalk";
import stringWidth from "string-width";
import App from "./App.js";
import { fetchFeeds } from "../lib/feeds.js";
import { normalizeRegionName } from "../lib/regions.js";
import { impactChipSuffix } from "../lib/impact.js";
import { severityMeter, timeAgo, truncateByWidth } from "../lib/format.js";
import type { RegionFilter } from "../lib/types.js";

const program = new Command();
program
  .name("geoticker")
  .description("Geopolitics news ticker for the terminal")
  .option("--region <name>", "start with a filter (All, India, Middle East, Europe, Asia-Pacific, Americas, Africa, Global)")
  .option("--speed <n>", "marquee chars per second", (v: string) => Number(v), 7)
  .option("--interval <seconds>", "refresh interval in seconds", (v: string) => Number(v), 60)
  .option("--once", "print latest 20 headlines and exit", false)
  .option("--no-prices", "skip all network calls for quotes", false);

program.parse(process.argv);
const opts = program.opts<{
  region?: string;
  speed: number;
  interval: number;
  once: boolean;
  prices: boolean;
}>();

let initialRegion: RegionFilter = "All";
if (opts.region) {
  const r = normalizeRegionName(opts.region);
  if (r) initialRegion = r;
  else console.error(`Unknown region "${opts.region}", using All.`);
}

const speed = Number.isFinite(opts.speed) && opts.speed > 0 ? opts.speed : 7;
const intervalSec = Number.isFinite(opts.interval) && opts.interval > 0 ? Math.floor(opts.interval) : 60;
const pricesEnabled = opts.prices !== false;
const noColor = Boolean(process.env.NO_COLOR) || !process.stdout.isTTY;
if (noColor) chalk.level = 0;

function restoreTerminal(): void {
  try {
    if (process.stdout.isTTY) process.stdout.write("\x1b[?25h\x1b[0m\n");
  } catch {
    // ignore
  }
}

async function runOnce(): Promise<void> {
  const width = process.stdout.columns ?? 100;
  try {
    const items = await fetchFeeds();
    let list = items.slice(0, 20);
    if (initialRegion !== "All") list = list.filter((it) => it.region === initialRegion).slice(0, 20);
    const now = new Date();
    for (const it of list) {
      const chip = impactChipSuffix(it.impact, 3);
      const sev = severityMeter(it.impact.severity);
      if (noColor) {
        const tail = `${chip ? ` | ${chip}` : ""} [${sev} ${it.impact.sentiment}]`;
        const head = truncateByWidth(`[${it.region}] ${it.title} — ${it.source} · ${timeAgo(it.published, now)}`, Math.max(20, width - stringWidth(tail) - 1));
        console.log(head + tail);
      } else {
        let color: (s: string) => string = chalk.white;
        if (it.region === "India") color = chalk.hex("#FF9933");
        else if (it.region === "Middle East") color = chalk.red;
        else if (it.region === "Europe") color = chalk.blue;
        else if (it.region === "Asia-Pacific") color = chalk.green;
        else if (it.region === "Americas") color = chalk.yellow;
        else if (it.region === "Africa") color = chalk.magenta;
        const chipStr = chip ? chalk.cyan(` ${chip}`) : "";
        const sevStr = it.impact.severity >= 3 ? chalk.red(sev) : chalk.gray(sev);
        console.log(
          `${color(`[${it.region}]`)} ${chalk.yellow(truncateByWidth(it.title, Math.max(20, width - 60)))}${chipStr} ${chalk.gray(`— ${it.source} · ${timeAgo(it.published, now)}`)} ${sevStr} ${chalk.gray(it.impact.sentiment)}`
        );
      }
    }
    if (list.length === 0) console.log("No headlines found.");
  } catch (err) {
    console.error(`Failed to fetch feeds: ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  if (opts.once) {
    await runOnce();
    return;
  }
  if (!process.stdout.isTTY) {
    await runOnce();
    return;
  }
  const app = render(
    <App initialRegion={initialRegion} speed={speed} intervalSec={intervalSec} noColor={noColor} pricesEnabled={pricesEnabled} />,
    { exitOnCtrlC: false }
  );
  const cleanup = (): void => {
    try {
      app.unmount();
    } catch {
      // ignore
    }
    restoreTerminal();
  };
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
  process.on("uncaughtException", (e) => {
    cleanup();
    console.error(e);
    process.exit(1);
  });
  await app.waitUntilExit();
  restoreTerminal();
}

void main();
