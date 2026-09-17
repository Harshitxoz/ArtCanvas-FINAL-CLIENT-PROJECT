import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import products from "@/data/products.json";
import categories from "@/data/categories.json";

export async function POST(req:Request){
  if(process.env.NODE_ENV==="production")return NextResponse.json({error:"Disabled in production."},{status:403});
  const secret=req.headers.get("x-seed-secret");
  if(process.env.SEED_SECRET && secret!==process.env.SEED_SECRET)return NextResponse.json({error:"Forbidden"},{status:403});
  try{
    const db=await getDb(); const now=new Date();
    await db.collection("products").deleteMany({});
    await db.collection("products").insertMany(products.map(p=>({...p,createdAt:now,updatedAt:now})));
    await db.collection("categories").deleteMany({});
    await db.collection("categories").insertMany(categories.map(c=>({...c,active:true,createdAt:now,updatedAt:now})));
    const email=(process.env.ADMIN_EMAIL||"admin@example.com").toLowerCase();
    const password=process.env.ADMIN_PASSWORD||"change-this-immediately";
    await db.collection("users").updateOne({email},{$set:{name:"Store Admin",email,passwordHash:await hashPassword(password),role:"admin",updatedAt:now},$setOnInsert:{createdAt:now}},{upsert:true});
    return NextResponse.json({ok:true,message:"Seeded products, categories and admin user."});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Seed failed"},{status:500})}
}
