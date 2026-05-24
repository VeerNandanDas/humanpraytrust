import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { checkAdminPassword } from "../../../../lib/auth";
import { getDbPool } from "../../../../lib/db";

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

    const pool = await getDbPool();
    if (pool) {
      const [res] = await pool.query("DELETE FROM cases WHERE id = ?", [params.id]);
      if ((res as any).affectedRows === 0) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }
    } else {
      const cases = await readCases();
      const updated = cases.filter((c: { id: string }) => c.id !== params.id);

      if (updated.length === cases.length) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }

      await writeCases(updated);
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE case error:", err);
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
    const pool = await getDbPool();
    
    if (pool) {
      if (body.isActive !== undefined) {
        await pool.query("UPDATE cases SET isActive = ? WHERE id = ?", [body.isActive ? 1 : 0, params.id]);
      } else {
        const keys = Object.keys(body);
        if (keys.length > 0) {
          const assignments = keys.map(k => `${k} = ?`).join(", ");
          const values = keys.map(k => body[k]);
          await pool.query(`UPDATE cases SET ${assignments} WHERE id = ?`, [...values, params.id]);
        }
      }
    } else {
      const cases = await readCases();
      const updated = cases.map((c: { id: string; isActive: boolean }) =>
        c.id === params.id ? { ...c, ...body } : c
      );

      await writeCases(updated);
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH case error:", err);
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 });
  }
}
