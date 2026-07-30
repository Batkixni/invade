import { eq, like, desc, or, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  items,
  itemNameOthers,
  itemInformation,
  vocabs,
  vocabExamples,
  news,
} from "./schema";

export interface ItemNameOther {
  id: number;
  name: string;
}

export interface ItemInfo {
  id: number;
  year: string | null;
  description: string;
  score: number;
}

export interface ItemWithRelations {
  code: string;
  parentCode: string | null;
  name: string;
  nameAlias: string | null;
  website: string | null;
  description: string;
  type: string;
  category: string;
  owner: string;
  score: number;
  createdAt: string;
  updatedAt: string;
  nameOthers: ItemNameOther[];
  information: ItemInfo[];
}

export interface VocabExample {
  id: number;
  description: string | null;
  correct: string;
  incorrect: string | null;
}

export interface VocabWithExamples {
  word: string;
  bopomofo: string | null;
  category: string;
  explicit: string | null;
  description: string | null;
  deprecation: string | null;
  notice: string | null;
  score: number;
  createdAt: string;
  updatedAt: string;
  examples: VocabExample[];
}

export async function getAllItems(): Promise<ItemWithRelations[]> {
  const allItems = await db.select().from(items).orderBy(desc(items.updatedAt));
  if (allItems.length === 0) return [];

  const codes = allItems.map((i) => i.code);

  const [nameOthersList, infoList] = await Promise.all([
    db
      .select()
      .from(itemNameOthers)
      .where(inArray(itemNameOthers.itemCode, codes)),
    db
      .select()
      .from(itemInformation)
      .where(inArray(itemInformation.itemCode, codes)),
  ]);

  const nameOthersMap = new Map<string, ItemNameOther[]>();
  for (const no of nameOthersList) {
    const arr = nameOthersMap.get(no.itemCode) ?? [];
    arr.push({ id: no.id, name: no.name });
    nameOthersMap.set(no.itemCode, arr);
  }

  const infoMap = new Map<string, ItemInfo[]>();
  for (const info of infoList) {
    const arr = infoMap.get(info.itemCode) ?? [];
    arr.push({
      id: info.id,
      year: info.year,
      description: info.description,
      score: info.score,
    });
    infoMap.set(info.itemCode, arr);
  }

  return allItems.map((item) => ({
    ...item,
    nameOthers: nameOthersMap.get(item.code) ?? [],
    information: infoMap.get(item.code) ?? [],
  }));
}

export async function getItemByCode(
  code: string,
): Promise<ItemWithRelations | null> {
  const [item] = await db
    .select()
    .from(items)
    .where(eq(items.code, code))
    .limit(1);
  if (!item) return null;

  const [nameOthersList, infoList] = await Promise.all([
    db
      .select()
      .from(itemNameOthers)
      .where(eq(itemNameOthers.itemCode, code)),
    db
      .select()
      .from(itemInformation)
      .where(eq(itemInformation.itemCode, code)),
  ]);

  return {
    ...item,
    nameOthers: nameOthersList.map((no) => ({ id: no.id, name: no.name })),
    information: infoList.map((info) => ({
      id: info.id,
      year: info.year,
      description: info.description,
      score: info.score,
    })),
  };
}

export async function getItemsByCategory(
  category: string,
): Promise<ItemWithRelations[]> {
  const allItems = await db
    .select()
    .from(items)
    .where(eq(items.category, category))
    .orderBy(desc(items.updatedAt));
  if (allItems.length === 0) return [];

  const codes = allItems.map((i) => i.code);

  const [nameOthersList, infoList] = await Promise.all([
    db
      .select()
      .from(itemNameOthers)
      .where(inArray(itemNameOthers.itemCode, codes)),
    db
      .select()
      .from(itemInformation)
      .where(inArray(itemInformation.itemCode, codes)),
  ]);

  const nameOthersMap = new Map<string, ItemNameOther[]>();
  for (const no of nameOthersList) {
    const arr = nameOthersMap.get(no.itemCode) ?? [];
    arr.push({ id: no.id, name: no.name });
    nameOthersMap.set(no.itemCode, arr);
  }

  const infoMap = new Map<string, ItemInfo[]>();
  for (const info of infoList) {
    const arr = infoMap.get(info.itemCode) ?? [];
    arr.push({
      id: info.id,
      year: info.year,
      description: info.description,
      score: info.score,
    });
    infoMap.set(info.itemCode, arr);
  }

  return allItems.map((item) => ({
    ...item,
    nameOthers: nameOthersMap.get(item.code) ?? [],
    information: infoMap.get(item.code) ?? [],
  }));
}

export async function searchItems(query: string): Promise<ItemWithRelations[]> {
  const pattern = `%${query}%`;
  const allItems = await db
    .select()
    .from(items)
    .where(or(like(items.name, pattern), like(items.nameAlias, pattern)))
    .orderBy(desc(items.updatedAt));
  if (allItems.length === 0) return [];

  const codes = allItems.map((i) => i.code);

  const [nameOthersList, infoList] = await Promise.all([
    db
      .select()
      .from(itemNameOthers)
      .where(inArray(itemNameOthers.itemCode, codes)),
    db
      .select()
      .from(itemInformation)
      .where(inArray(itemInformation.itemCode, codes)),
  ]);

  const nameOthersMap = new Map<string, ItemNameOther[]>();
  for (const no of nameOthersList) {
    const arr = nameOthersMap.get(no.itemCode) ?? [];
    arr.push({ id: no.id, name: no.name });
    nameOthersMap.set(no.itemCode, arr);
  }

  const infoMap = new Map<string, ItemInfo[]>();
  for (const info of infoList) {
    const arr = infoMap.get(info.itemCode) ?? [];
    arr.push({
      id: info.id,
      year: info.year,
      description: info.description,
      score: info.score,
    });
    infoMap.set(info.itemCode, arr);
  }

  return allItems.map((item) => ({
    ...item,
    nameOthers: nameOthersMap.get(item.code) ?? [],
    information: infoMap.get(item.code) ?? [],
  }));
}

export async function getAllVocabs(): Promise<VocabWithExamples[]> {
  const allVocabs = await db
    .select()
    .from(vocabs)
    .orderBy(desc(vocabs.updatedAt));
  if (allVocabs.length === 0) return [];

  const words = allVocabs.map((v) => v.word);

  const examplesList = await db
    .select()
    .from(vocabExamples)
    .where(inArray(vocabExamples.vocabWord, words));

  const examplesMap = new Map<string, VocabExample[]>();
  for (const ex of examplesList) {
    const arr = examplesMap.get(ex.vocabWord) ?? [];
    arr.push({
      id: ex.id,
      description: ex.description,
      correct: ex.correct,
      incorrect: ex.incorrect,
    });
    examplesMap.set(ex.vocabWord, arr);
  }

  return allVocabs.map((vocab) => ({
    ...vocab,
    examples: examplesMap.get(vocab.word) ?? [],
  }));
}

export async function getVocabByWord(
  word: string,
): Promise<VocabWithExamples | null> {
  const [vocab] = await db
    .select()
    .from(vocabs)
    .where(eq(vocabs.word, word))
    .limit(1);
  if (!vocab) return null;

  const examplesList = await db
    .select()
    .from(vocabExamples)
    .where(eq(vocabExamples.vocabWord, word));

  return {
    ...vocab,
    examples: examplesList.map((ex) => ({
      id: ex.id,
      description: ex.description,
      correct: ex.correct,
      incorrect: ex.incorrect,
    })),
  };
}

export async function searchVocabs(
  query: string,
): Promise<VocabWithExamples[]> {
  const pattern = `%${query}%`;
  const allVocabs = await db
    .select()
    .from(vocabs)
    .where(
      or(
        like(vocabs.word, pattern),
        like(vocabs.description, pattern),
      ),
    )
    .orderBy(desc(vocabs.updatedAt));
  if (allVocabs.length === 0) return [];

  const words = allVocabs.map((v) => v.word);

  const examplesList = await db
    .select()
    .from(vocabExamples)
    .where(inArray(vocabExamples.vocabWord, words));

  const examplesMap = new Map<string, VocabExample[]>();
  for (const ex of examplesList) {
    const arr = examplesMap.get(ex.vocabWord) ?? [];
    arr.push({
      id: ex.id,
      description: ex.description,
      correct: ex.correct,
      incorrect: ex.incorrect,
    });
    examplesMap.set(ex.vocabWord, arr);
  }

  return allVocabs.map((vocab) => ({
    ...vocab,
    examples: examplesMap.get(vocab.word) ?? [],
  }));
}

export async function getAllNews() {
  return db.select().from(news).orderBy(desc(news.date));
}

export async function getNewsBySlug(slug: string) {
  const [result] = await db
    .select()
    .from(news)
    .where(eq(news.slug, slug))
    .limit(1);
  return result ?? null;
}
