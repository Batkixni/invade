import { readFileSync, readdirSync, existsSync, mkdirSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "database");
const DB_PATH = join(__dirname, "..", "data", "invade.db");

function loadYamlFiles<T>(dir: string): T[] {
  const fullDir = join(DATA_DIR, dir);
  if (!existsSync(fullDir)) return [];
  return readdirSync(fullDir)
    .filter((f) => f.endsWith(".yml"))
    .map((f) => {
      const raw = readFileSync(join(fullDir, f), "utf-8");
      const data = parse(raw);
      return { ...data, _filename: f };
    });
}

function now() {
  return new Date().toISOString();
}

const OWNER_BASE_SCORES: Record<string, number> = {
  CHINESE: 4.0,     // 中資企業 (最高 4.0 分)
  HONGKONGESE: 2.5, // 港資企業 (2.5 分)
  TAIWANESE: 1.0,   // 台資企業 (1.0 分)
  FOREIGN: 0.5,     // 外資企業 (0.5 分)
};

const TYPE_BONUS: Record<string, number> = {
  PARTY: 3.0,       // 政黨機構 (最高 +3.0 分)
  GOVERNMENT: 3.0,  // 政府/軍事機構 (最高 +3.0 分)
  ORGANIZATION: 1.0, // 組織/基金會 (+1.0 分)
  COMPANY: 0.0,
  SOFTWARE: 0.0,
  PERSON: 0.0,
  PRODUCT: 0.0,
};

const INVASION_SEVERITY: Record<string, number> = {
  SUPPORTED: 1.5,    // 配合打壓、審查、人權侵害
  FUNDED: 1.2,       // 中資持股、黨支部
  COLLABORATED: 0.8, // 技術/雲端合作
  MANIPULATED: 0.5,  // 文化/言論引導
};

interface ScoreBreakdown {
  totalScore: number;
  scoreOwner: number;
  scoreType: number;
  scoreEvents: number;
  scoreInheritance: number;
}

function calculateItemScoreDetails(item: any, allItemsMap: Map<string, any>, visited = new Set<string>()): ScoreBreakdown {
  if (visited.has(item.code)) {
    return { totalScore: 5, scoreOwner: 2, scoreType: 0, scoreEvents: 1, scoreInheritance: 0 };
  }
  visited.add(item.code);

  const owner = item.owner || "CHINESE";
  const type = item.type || "COMPANY";

  const scoreOwner = OWNER_BASE_SCORES[owner] ?? 2.0;
  const scoreType = TYPE_BONUS[type] ?? 0.0;

  // 累加侵略歷史事件 (最高 3.0 分)
  let scoreEventsRaw = 0;
  if (item.information && Array.isArray(item.information)) {
    item.information.forEach((info: any, idx: number) => {
      const sev = INVASION_SEVERITY[info.invasion] || 0.5;
      const weight = Math.max(0.4, 1.0 - idx * 0.2);
      scoreEventsRaw += sev * weight;
    });
  }
  const scoreEvents = Math.min(3.0, Math.round(scoreEventsRaw * 10) / 10);

  const rawTotal = Math.min(10.0, Math.round((scoreOwner + scoreType + scoreEvents) * 10) / 10);

  let scoreInheritance = 0;
  let finalTotal = rawTotal;

  // 母公司/主實體保底繼承 (承接母公司 80% 分數為保底分)
  if (item.parent_code && allItemsMap.has(item.parent_code)) {
    const parent = allItemsMap.get(item.parent_code);
    const parentDetails = calculateItemScoreDetails(parent, allItemsMap, new Set(visited));
    const inheritedFloor = Math.round(parentDetails.totalScore * 0.8 * 10) / 10;
    if (inheritedFloor > rawTotal) {
      scoreInheritance = inheritedFloor;
      finalTotal = inheritedFloor;
    }
  }

  const totalScore = Math.min(10, Math.max(1, Math.round(finalTotal)));

  return {
    totalScore,
    scoreOwner: Math.round(scoreOwner * 10) / 10,
    scoreType: Math.round(scoreType * 10) / 10,
    scoreEvents: Math.round(scoreEvents * 10) / 10,
    scoreInheritance: Math.round(scoreInheritance * 10) / 10,
  };
}


function migrateItems(sqlite: Database.Database) {
  console.log("Migrating items with 4-dimensional score breakdown model...");
  const rawItems = [
    ...loadYamlFiles<any>("items"),
    ...loadYamlFiles<any>("items_person"),
  ];

  const allItemsMap = new Map<string, any>();
  rawItems.forEach((item) => allItemsMap.set(item.code, item));

  const insertItem = sqlite.prepare(
    `INSERT INTO items (code, parent_code, name, name_alias, website, description, type, category, owner, score, score_owner, score_type, score_events, score_inheritance, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertNameOther = sqlite.prepare(
    `INSERT INTO item_name_others (item_code, name) VALUES (?, ?)`
  );
  const insertInfo = sqlite.prepare(
    `INSERT INTO item_information (item_code, year, description, score) VALUES (?, ?, ?, ?)`
  );

  const insertMany = sqlite.transaction((items: any[]) => {
    for (const item of items) {
      const breakdown = calculateItemScoreDetails(item, allItemsMap);
      insertItem.run(
        item.code, item.parent_code || null, item.name, item.name_alias || null,
        item.website || null, item.description || "", item.type || "COMPANY",
        item.category || "INTERNET", item.owner || "CHINESE",
        breakdown.totalScore,
        Math.round(breakdown.scoreOwner * 10),
        Math.round(breakdown.scoreType * 10),
        Math.round(breakdown.scoreEvents * 10),
        Math.round(breakdown.scoreInheritance * 10),
        now(), now()
      );

      if (item.name_others) {
        for (const name of item.name_others) {
          insertNameOther.run(item.code, name);
        }
      }

      if (item.information) {
        for (const info of item.information) {
          const infoScore = INVASION_SEVERITY[info.invasion] ? Math.round(INVASION_SEVERITY[info.invasion] * 3) : 0;
          insertInfo.run(
            item.code, info.year || null, info.description || "",
            infoScore
          );
        }
      }
    }
  });

  insertMany(rawItems);
  console.log(`  ${rawItems.length} items migrated with 4-D score breakdowns.`);
}

function migrateVocabs(sqlite: Database.Database) {
  console.log("Migrating vocabs...");
  const rawVocabs = loadYamlFiles<any>("vocabs");

  const insertVocab = sqlite.prepare(
    `INSERT INTO vocabs (word, bopomofo, category, explicit, description, deprecation, notice, score, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertExample = sqlite.prepare(
    `INSERT INTO vocab_examples (vocab_word, description, correct, incorrect) VALUES (?, ?, ?, ?)`
  );
  const insertExampleWord = sqlite.prepare(
    `INSERT INTO vocab_example_words (example_id, word) VALUES (?, ?)`
  );

  const insertMany = sqlite.transaction((vocabs: any[]) => {
    for (const vocab of vocabs) {
      insertVocab.run(
        vocab.word, vocab.bopomofo || null, vocab.category || "NOUN",
        vocab.explicit || null, vocab.description || null, vocab.deprecation || null,
        vocab.notice || null, 0, now(), now()
      );

      if (vocab.examples) {
        for (const example of vocab.examples) {
          const result = insertExample.run(
            vocab.word, example.description || null, example.correct || "", example.incorrect || null
          );

          if (example.words) {
            for (const word of example.words) {
              insertExampleWord.run(Number(result.lastInsertRowid), word);
            }
          }
        }
      }
    }
  });

  insertMany(rawVocabs);
  console.log(`  ${rawVocabs.length} vocabs migrated`);
}

function migrateNews(sqlite: Database.Database) {
  console.log("Migrating news...");
  const rawNews = loadYamlFiles<any>("news");

  const insertNews = sqlite.prepare(
    `INSERT INTO news (slug, date, title, summary, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const insertMany = sqlite.transaction((newsItems: any[]) => {
    for (const newsItem of newsItems) {
      const title = newsItem.title || newsItem._filename.replace(/\.yml$/, "").replace(/^\d{4}-\d{2}_/, "");
      const slug = title;
      insertNews.run(slug, newsItem.date || "", title, newsItem.summary || "", newsItem.content || "", now(), now());
    }
  });

  insertMany(rawNews);
  console.log(`  ${rawNews.length} news migrated`);
}

function copyAssets() {
  const logoDir = join(DATA_DIR, "items_logos");
  const targetDir = join(__dirname, "..", "public", "logos");
  if (existsSync(logoDir)) {
    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
    for (const file of readdirSync(logoDir)) {
      try {
        cpSync(join(logoDir, file), join(targetDir, file), { force: true });
      } catch {
        console.warn(`  Skipping ${file} (copy failed)`);
      }
    }
    console.log("  Logos copied to public/logos/");
  }
}

if (!existsSync(dirname(DB_PATH))) mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

console.log("Starting migration...\n");

try {
  sqlite.exec("DROP TABLE IF EXISTS item_name_others");
  sqlite.exec("DROP TABLE IF EXISTS item_information");
  sqlite.exec("DROP TABLE IF EXISTS vocab_example_words");
  sqlite.exec("DROP TABLE IF EXISTS vocab_examples");
  sqlite.exec("DROP TABLE IF EXISTS items");
  sqlite.exec("DROP TABLE IF EXISTS vocabs");
  sqlite.exec("DROP TABLE IF EXISTS news");

  sqlite.exec(`
    CREATE TABLE items (
      code TEXT PRIMARY KEY,
      parent_code TEXT,
      name TEXT NOT NULL,
      name_alias TEXT,
      website TEXT,
      description TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'COMPANY',
      category TEXT NOT NULL DEFAULT 'INTERNET',
      owner TEXT NOT NULL DEFAULT 'CHINESE',
      score INTEGER NOT NULL DEFAULT 0,
      score_owner INTEGER NOT NULL DEFAULT 0,
      score_type INTEGER NOT NULL DEFAULT 0,
      score_events INTEGER NOT NULL DEFAULT 0,
      score_inheritance INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE item_name_others (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_code TEXT NOT NULL REFERENCES items(code) ON DELETE CASCADE,
      name TEXT NOT NULL
    )
  `);
  sqlite.exec(`
    CREATE TABLE item_information (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_code TEXT NOT NULL REFERENCES items(code) ON DELETE CASCADE,
      year TEXT,
      description TEXT NOT NULL DEFAULT '',
      score INTEGER NOT NULL DEFAULT 0
    )
  `);
  sqlite.exec(`
    CREATE TABLE vocabs (
      word TEXT PRIMARY KEY,
      bopomofo TEXT,
      category TEXT NOT NULL DEFAULT 'NOUN',
      explicit TEXT,
      description TEXT,
      deprecation TEXT,
      notice TEXT,
      score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  sqlite.exec(`
    CREATE TABLE vocab_examples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vocab_word TEXT NOT NULL REFERENCES vocabs(word) ON DELETE CASCADE,
      description TEXT,
      correct TEXT NOT NULL DEFAULT '',
      incorrect TEXT
    )
  `);
  sqlite.exec(`
    CREATE TABLE vocab_example_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      example_id INTEGER NOT NULL REFERENCES vocab_examples(id) ON DELETE CASCADE,
      word TEXT NOT NULL
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS news (
      slug TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expiresAt INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt INTEGER,
      refreshTokenExpiresAt INTEGER,
      scope TEXT,
      password TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER,
      updatedAt INTEGER
    )
  `);


  migrateItems(sqlite);
  migrateVocabs(sqlite);
  migrateNews(sqlite);
  copyAssets();

  console.log("\nMigration complete!");
} catch (err) {
  console.error("Migration failed:", err);
  process.exit(1);
} finally {
  sqlite.close();
}
