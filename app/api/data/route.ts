import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "app-data.json");

const DEFAULT_DATA = {
  projects: [],
  progressProjects: [],
  outsourcingRecords: [],
  projectsLoadedAt: null,
  progressLoadedAt: null,
  outsourcingLoadedAt: null,
  projectsFileTitle: null,
};

export async function GET() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json(DEFAULT_DATA);
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(DEFAULT_DATA);
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
