import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { checkAdminPassword } from "../../../lib/auth";

const DATA_PATH = path.join(process.cwd(), "data", "cases.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Helper: Read cases from JSON
async function readCases() {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper: Write cases to JSON
async function writeCases(cases: object[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(cases, null, 2));
}

// ─── GET: Fetch all cases ─────────────────────────────────
export async function GET() {
  try {
    const cases = await readCases();
    return NextResponse.json(cases);
  } catch {
    return NextResponse.json({ error: "Failed to load cases" }, { status: 500 });
  }
}

// ─── POST: Add a new case ─────────────────────────────────
export async function POST(req: Request) {
  try {
    // Admin password check
    const adminPass = req.headers.get("x-admin-password");
    const isAuthed = await checkAdminPassword(adminPass);
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title       = formData.get("title") as string;
    const description = formData.get("description") as string;
    const goalAmount  = formData.get("goalAmount") as string;
    const patientName = formData.get("patientName") as string;
    const location    = formData.get("location") as string;
    const urgency     = formData.get("urgency") as string;
    const image       = formData.get("image") as File | null;
    const document    = formData.get("document") as File | null;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    await fs.mkdir(path.join(UPLOAD_DIR, "images"), { recursive: true });
    await fs.mkdir(path.join(UPLOAD_DIR, "documents"), { recursive: true });

    let imageUrl = "";
    if (image && image.size > 0) {
      const imgBuffer = Buffer.from(await image.arrayBuffer());
      const imgName   = Date.now() + "_" + image.name.replace(/\s+/g, "_");
      await fs.writeFile(path.join(UPLOAD_DIR, "images", imgName), imgBuffer);
      imageUrl = `/uploads/images/${imgName}`;
    }

    let documentUrl = "";
    let documentName = "";
    if (document && document.size > 0) {
      const docBuffer = Buffer.from(await document.arrayBuffer());
      const docName   = Date.now() + "_" + document.name.replace(/\s+/g, "_");
      await fs.writeFile(path.join(UPLOAD_DIR, "documents", docName), docBuffer);
      documentUrl  = `/uploads/documents/${docName}`;
      documentName = document.name;
    }

    const cases = await readCases();
    const newCase = {
      id:           Date.now().toString(),
      title,
      patientName:  patientName || "",
      location:     location || "",
      urgency:      urgency || "medium",
      description,
      goalAmount:   parseFloat(goalAmount) || 0,
      raisedAmount: 0,
      imageUrl,
      documentUrl,
      documentName,
      createdAt:    new Date().toISOString(),
      isActive:     true,
    };

    cases.push(newCase);
    await writeCases(cases);

    return NextResponse.json({ success: true, case: newCase });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to save case" }, { status: 500 });
  }
}
