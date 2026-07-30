import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function scoreToLevel(score: number): string {
  if (score <= 2) return "輕微";
  if (score <= 4) return "注意";
  if (score <= 6) return "警告";
  if (score <= 8) return "嚴重";
  return "極度侵略";
}

export function getScoreColor(score: number): string {
  if (score <= 2) return "text-zinc-300 border-zinc-700/80 bg-zinc-900/90";
  if (score <= 4) return "text-slate-300 border-slate-700/80 bg-slate-900/90";
  if (score <= 6) return "text-indigo-300 border-indigo-800/80 bg-indigo-950/90";
  if (score <= 8) return "text-purple-300 border-purple-800/80 bg-purple-950/90";
  return "text-rose-300 border-rose-800/80 bg-rose-950/90";
}

export const CATEGORY_MAP: Record<string, string> = {
  ENTERTAINMENT: "娛樂影視",
  INTERNET: "網路服務",
  GAME: "遊戲電競",
  FOOD: "餐飲食品",
  FINANCE: "金融銀行",
  ELECTRONIC: "電子產品",
  APPLIANCE: "家電設備",
  VEHICLE: "汽車交通",
  TECHNOLOGY: "科技技術",
  MEDIA: "新聞媒體",
  TRAVEL: "旅遊住宿",
  POLITICAL: "政治政黨",
  TELECOM: "電信通訊",
  CONSTRUCTION: "建築地產",
  MIXED: "綜合產業",
  MANUFACTURE: "製造工業",
  ENERGY: "能源石化",
  GROUP: "企業集團",
  SOFTWARE: "軟體應用",
  SHOPPING: "電商購物",
  ART: "藝術文化",
  SPORTS: "體育運動",
  EDUCATION: "教育學術",
};

export const OWNER_MAP: Record<string, string> = {
  CHINESE: "中國資本",
  TAIWANESE: "台灣資本",
  HONGKONGESE: "香港資本",
  FOREIGN: "外國資本",
};

export const TYPE_MAP: Record<string, string> = {
  COMPANY: "企業",
  SERVICE: "服務",
  ORGANIZATION: "組織",
  SOFTWARE: "軟體",
  GAME: "遊戲",
  PERSON: "個人",
  PRODUCT: "產品",
  PARTY: "政黨",
  GOVERNMENT: "政府機構",
};


export function translateCategory(cat: string): string {
  return CATEGORY_MAP[cat] || cat;
}

export function translateOwner(owner: string): string {
  return OWNER_MAP[owner] || owner;
}

export function translateType(type: string): string {
  return TYPE_MAP[type] || type;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

