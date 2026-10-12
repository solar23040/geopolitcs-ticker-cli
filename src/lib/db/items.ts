import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient } from "@libsql/client";
import type { Client, Row } from "@libsql/client";
import { scoreItem } from "../impact.js";
import { ALL_REGIONS } from "../types.js";
import type { NewsItem, Region } from "../types.js";

// All SQL in the app lives in this module.

const FALLBACK_PATH = resolve(process.cwd(), "data/news.db");
const PRUNE_TTL_MS = 7 * 24 * 3600 * 1000;

export interface StoredItem {
  id: string;
  title: string;
  link: string;
  source: string;
  published_at: number;
  fetched_at: number;
  region: string | null;
  severity: number | null;
  summary: string | null;
  classified_by: string | null;
  cluster_id: string | null;
}

export interface UpsertRow {
  id: string;
  title: string;
  link: string;
  source: string;
  published_at: number;
  fetched_at: number;
  region?: Region | null;
  severity?: number | null;
  summary?: string | null;
  classified_by?: "keyword" | "gemini" | null;
  cluster_id?: string | null;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    link TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT '',
    published_at INTEGER NOT NULL,
    fetched_at INTEGER NOT NULL,
    region TEXT,
    severity INTEGER,
    summary TEXT,
    classified_by TEXT,
    cluster_id TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_items_fetched ON items(fetched_at);
  CREATE INDEX IF NOT EXISTS idx_items_published ON items(published_at);
  CREATE INDEX IF NOT EXISTS idx_items_cluster ON items(cluster_id);
`;

/** Stable id: hash of normalized title + source. */
export function itemId(title: string, source: string): string {
  const norm = `${title.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim()}|${source.toLowerCase().trim()}`;
  return createHash("sha1").update(norm).digest("hex").slice(0, 16);
}

let client: Client | null = null;
let configuredUrl: string | null = null;

function defaultUrl(): string {
  const remote = (process.env.TURSO_DATABASE_URL ?? "").trim();
  const token = (process.env.TURSO_AUTH_TOKEN ?? "").trim();
  if (remote && token) return remote;
  if (remote || token) {
    console.warn("[db] TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must both be set; using local file");
  }
  return `file:${process.env.NEWS_DB_PATH ?? FALLBACK_PATH}`;
}

function ensureDirForFileUrl(url: string): void {
  const m = /^file:(.+)$/.exec(url);
  if (!m || m[1] === ":memory:") return;
  mkdirSync(dirname(m[1]!), { recursive: true });
}

function connect(url: string): Client {
  const token = (process.env.TURSO_AUTH_TOKEN ?? "").trim();
  if (url.startsWith("file:")) {
    ensureDirForFileUrl(url);
    return createClient({ url });
  }
  return createClient({ url, authToken: token || undefined });
}

/**
 * Connect (or reconnect) and create tables if missing. Idempotent and safe
 * on an empty DB. Pass a url in tests to use a temp file. On failure the
 * previous client is dropped and the error rethrown (callers must catch).
 */
export async function initDb(url?: string): Promise<Client> {
  const target = url ?? configuredUrl ?? defaultUrl();
  const next = connect(target);
  try {
    await next.execute(SCHEMA);
  } catch (err) {
    try {
      next.close();
    } catch {
      // ignore
    }
    client = null;
    configuredUrl = target;
    throw err;
  }
  if (client) {
    try {
      client.close();
    } catch {
      // ignore
    }
  }
  client = next;
  configuredUrl = target;
  return client;
}

async function getClient(): Promise<Client> {
  if (client) return client;
  return initDb();
}

function toStoredItem(row: Row): StoredItem {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    link: String(row.link ?? ""),
    source: String(row.source ?? ""),
    published_at: Number(row.published_at ?? 0),
    fetched_at: Number(row.fetched_at ?? 0),
    region: (row.region as string | null) ?? null,
    severity: (row.severity as number | null) ?? null,
    summary: (row.summary as string | null) ?? null,
    classified_by: (row.classified_by as string | null) ?? null,
    cluster_id: (row.cluster_id as string | null) ?? null,
  };
}

function validRegion(r: unknown): Region {
  return typeof r === "string" && (ALL_REGIONS as string[]).includes(r) ? (r as Region) : "Global";
}

function validSeverity(s: unknown): 1 | 2 | 3 | 4 | 5 {
  const n = Number(s);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? (n as 1 | 2 | 3 | 4 | 5) : 1;
}

/** Stored row -> live NewsItem (recomputes market impact from the title). */
export function toNewsItem(row: StoredItem): NewsItem {
  const published = new Date(row.published_at);
  const fetched = new Date(row.fetched_at);
  return {
    title: row.title,
    source: row.source,
    link: row.link,
    published: Number.isNaN(published.getTime()) ? new Date() : published,
    region: validRegion(row.region),
    impact: { ...scoreItem(row.title), severity: validSeverity(row.severity) },
    cluster_id: row.cluster_id ?? undefined,
    sources: [{ name: row.source, link: row.link }],
    source_count: 1,
    fetched_at: Number.isNaN(fetched.getTime()) ? new Date() : fetched,
    summary: row.summary ?? undefined,
    classified_by: row.classified_by === "gemini" ? "gemini" : "keyword",
    stale: true,
  };
}

/**
 * Insert or update rows. Never creates duplicates; never overwrites
 * fetched_at on an existing row (first-seen time is kept).
 */
export async function upsertItems(rows: UpsertRow[]): Promise<void> {
  if (rows.length === 0) return;
  const db = await getClient();
  const stmts = rows.map((r) => ({
    sql: `INSERT INTO items (id, title, link, source, published_at, fetched_at, region, severity, summary, classified_by, cluster_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            link = excluded.link,
            source = excluded.source,
            published_at = excluded.published_at,
            region = excluded.region,
            severity = excluded.severity,
            summary = COALESCE(excluded.summary, items.summary),
            classified_by = COALESCE(excluded.classified_by, items.classified_by),
            cluster_id = COALESCE(excluded.cluster_id, items.cluster_id)`,
    args: [
      r.id, r.title, r.link, r.source, r.published_at, r.fetched_at,
      r.region ?? null, r.severity ?? null, r.summary ?? null,
      r.classified_by ?? null, r.cluster_id ?? null,
    ] as Array<string | number | null>,
  }));
  // Chunked so remote batches stay small.
  for (let i = 0; i < stmts.length; i += 100) {
    await db.batch(stmts.slice(i, i + 100));
  }
  // Push local writes to Turso when using a synced replica.
  try {
    await db.sync();
  } catch {
    // Local-only clients throw here; sync is best-effort either way.
  }
}

export async function getItemsByIds(ids: string[]): Promise<Map<string, StoredItem>> {
  const out = new Map<string, StoredItem>();
  if (ids.length === 0) return out;
  const db = await getClient();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const rs = await db.execute({
      sql: `SELECT * FROM items WHERE id IN (${chunk.map(() => "?").join(",")})`,
      args: chunk,
    });
    for (const row of rs.rows) {
      const s = toStoredItem(row);
      out.set(s.id, s);
    }
  }
  return out;
}

/** Stored items newer than `hours` (by fetched or published time). */
export async function getRecent(hours: number): Promise<StoredItem[]> {
  const db = await getClient();
  const cutoff = Date.now() - hours * 3600 * 1000;
  const rs = await db.execute({
    sql: "SELECT * FROM items WHERE fetched_at >= ? OR published_at >= ? ORDER BY published_at DESC LIMIT 500",
    args: [cutoff, cutoff],
  });
  return rs.rows.map(toStoredItem);
}

/** Delete items older than 7 days. Returns rows removed. */
export async function pruneOld(): Promise<number> {
  const db = await getClient();
  const rs = await db.execute({
    sql: "DELETE FROM items WHERE fetched_at < ?",
    args: [Date.now() - PRUNE_TTL_MS],
  });
  return rs.rowsAffected;
}
