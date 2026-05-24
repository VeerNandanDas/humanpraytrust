import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { checkAdminPassword } from "../../../../lib/auth";

const DATA_PATH = path.join(process.cwd(), "data", "cases.json");

async function readCases() {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeCases(cases: object[]) {
  await fs.writeFile(DATA_PATH, JSON.stringify(cases, null, 2));
}

// ─── DELETE: Remove a case by ID ─────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminPass = req.headers.get("x-admin-password");
    const isAuthed = await checkAdminPassword(adminPass);
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cases = await readCases();
    const updated = cases.filter((c: { id: string }) => c.id !== params.id);

    if (updated.length === cases.length) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    await writeCases(updated);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete case" }, { status: 500 });
  }
}

// ─── PATCH: Toggle active status ─────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminPass = req.headers.get("x-admin-password");
    const isAuthed = await checkAdminPassword(adminPass);
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const cases = await readCases();
    const updated = cases.map((c: { id: string; isActive: boolean }) =>
      c.id === params.id ? { ...c, ...body } : c
    );

    await writeCases(updated);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 });
  }
}
