import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAdminConfig } from "../../../../lib/auth";

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();
    
    if (!amount || amount < 10) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const config = await getAdminConfig();
    const key_id = config.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    const key_secret = config.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({ id: order.id, currency: order.currency, amount: order.amount });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
