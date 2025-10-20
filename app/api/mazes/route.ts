import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "mazes.json");
  const text = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(text);
  return NextResponse.json(data);
}
