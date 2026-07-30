import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const items = sqliteTable("items", {
  code: text("code").primaryKey(),
  parentCode: text("parent_code"),
  name: text("name").notNull(),
  nameAlias: text("name_alias"),
  website: text("website"),
  description: text("description").notNull().default(""),
  type: text("type").notNull().default("COMPANY"),
  category: text("category").notNull().default("INTERNET"),
  owner: text("owner").notNull().default("CHINESE"),
  score: integer("score").notNull().default(0),
  scoreOwner: integer("score_owner").notNull().default(0),
  scoreType: integer("score_type").notNull().default(0),
  scoreEvents: integer("score_events").notNull().default(0),
  scoreInheritance: integer("score_inheritance").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});


export const itemNameOthers = sqliteTable("item_name_others", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemCode: text("item_code").notNull().references(() => items.code, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const itemInformation = sqliteTable("item_information", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemCode: text("item_code").notNull().references(() => items.code, { onDelete: "cascade" }),
  year: text("year"),
  description: text("description").notNull().default(""),
  score: integer("score").notNull().default(0),
});

export const vocabs = sqliteTable("vocabs", {
  word: text("word").primaryKey(),
  bopomofo: text("bopomofo"),
  category: text("category").notNull().default("NOUN"),
  explicit: text("explicit"),
  description: text("description"),
  deprecation: text("deprecation"),
  notice: text("notice"),
  score: integer("score").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const vocabExamples = sqliteTable("vocab_examples", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vocabWord: text("vocab_word").notNull().references(() => vocabs.word, { onDelete: "cascade" }),
  description: text("description"),
  correct: text("correct").notNull().default(""),
  incorrect: text("incorrect"),
});

export const vocabExampleWords = sqliteTable("vocab_example_words", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  exampleId: integer("example_id").notNull().references(() => vocabExamples.id, { onDelete: "cascade" }),
  word: text("word").notNull(),
});

export const news = sqliteTable("news", {
  slug: text("slug").primaryKey(),
  date: text("date").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  content: text("content").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});


export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type ItemInformation = typeof itemInformation.$inferSelect;
export type Vocab = typeof vocabs.$inferSelect;
export type NewVocab = typeof vocabs.$inferInsert;
export type News = typeof news.$inferSelect;
export type NewNews = typeof news.$inferInsert;


