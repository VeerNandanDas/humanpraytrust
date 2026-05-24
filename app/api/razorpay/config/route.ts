import { NextResponse } from "next/server";
import { getAdminConfig } from "../../../../lib/auth";

export async function GET() {
  try {
    const config = await getAdminConfig();
    const key_id = config.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    return NextResponse.json({ key_id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}
