import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
export async function POST(req:Request){try{const {amount,receipt}=await req.json();if(!Number.isInteger(amount)||amount<=0)return NextResponse.json({error:"Invalid amount"},{status:400});const order=await getRazorpay().orders.create({amount,currency:"INR",receipt:String(receipt)});return NextResponse.json(order)}catch{return NextResponse.json({error:"Payment gateway is not configured."},{status:503})}}
