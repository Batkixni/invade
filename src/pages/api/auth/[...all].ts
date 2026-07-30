import { auth } from "@/lib/auth";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  return auth.handler(context.request);
};

export const POST: APIRoute = async (context) => {
  return auth.handler(context.request);
};
