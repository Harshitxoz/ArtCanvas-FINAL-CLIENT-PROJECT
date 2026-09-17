import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
export async function POST(req:Request){try{const parsed=loginSchema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Invalid credentials."},{status:400});const {email,password}=parsed.data;const db=await getDb();const user=await db.collection("users").findOne({email:email.toLowerCase()});if(!user||!(await verifyPassword(password,user.passwordHash)))return NextResponse.json({error:"Invalid email or password."},{status:401});const session={id:String(user._id),name:String(user.name),email:String(user.email),role:user.role};await createSession(session);return NextResponse.json({ok:true,user:session})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Login failed."},{status:500})}}
