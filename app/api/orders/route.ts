import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { orderSchema } from "@/lib/validations";
import { getSettings } from "@/lib/settings";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req:Request){
  try{
    const parsed=orderSchema.safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({error:"Invalid order data.",details:parsed.error.flatten()},{status:400});
    const session=await getSession(); const db=await getDb();
    const ids=parsed.data.items.map(i=>i.productId).filter(ObjectId.isValid).map(id=>new ObjectId(id));
    const products=await db.collection("products").find({_id:{$in:ids},active:true}).toArray();
    const lookup=new Map(products.map(p=>[String(p._id),p]));
    const items=parsed.data.items.map(item=>{const p=lookup.get(item.productId);if(!p)throw new Error("PRODUCT_NOT_FOUND");const size=p.sizes.find((s:{label:string;price:number;stock:number})=>s.label===item.size);if(!size||size.stock<item.quantity)throw new Error("OUT_OF_STOCK");const frame=item.frame==="framed"?"framed":"unframed";if(frame==="framed"&&p.frameAvailable!==true)throw new Error("FRAME_UNAVAILABLE");const delta=frame==="framed"?Math.max(0,Number(p.framedPrice||0)-Number(p.unframedPrice||0)):0;return {productId:item.productId,title:p.title,slug:p.slug,image:p.images[0],size:size.label,frame,price:size.price+delta,quantity:item.quantity};});
    const subtotal=items.reduce((s,i)=>s+i.price*i.quantity,0);let discount=0;let couponCode="";if(parsed.data.couponCode){const code=parsed.data.couponCode.trim().toUpperCase();const c=await db.collection("coupons").findOne({code,active:true});if(!c)throw new Error("COUPON_INVALID");if(c.expiresAt&&new Date(c.expiresAt)<=new Date())throw new Error("COUPON_EXPIRED");if(c.usageLimit&&Number(c.usedCount||0)>=Number(c.usageLimit))throw new Error("COUPON_LIMIT");discount=c.type==="percentage"?Math.min(subtotal,subtotal*Number(c.value)/100):Math.min(subtotal,Number(c.value));couponCode=code;}const settings=await getSettings();const discountedSubtotal=Math.max(0,subtotal-discount);const freeThreshold=Number(settings.freeShippingThreshold);const fee=Number(settings.shippingFee);const shipping=discountedSubtotal>=freeThreshold?0:fee;const total=discountedSubtotal+shipping;const now=new Date();
    const result=await db.collection("orders").insertOne({userId:session?new ObjectId(session.id):undefined,items,customer:parsed.data.customer,subtotal,discount,couponCode:couponCode||undefined,shipping,total,status:"pending",paymentStatus:"pending",createdAt:now,updatedAt:now});
    let payment=null;
    try{const razorpay=getRazorpay();payment=await razorpay.orders.create({amount:total*100,currency:"INR",receipt:String(result.insertedId)});}catch(paymentError){console.error("[RAZORPAY_ORDER_ERROR]", paymentError instanceof Error ? paymentError.message : paymentError);}
    return NextResponse.json({orderId:String(result.insertedId),payment});
  }catch(e){console.error("[ORDER_CREATE_ERROR]", e);const message=e instanceof Error?e.message:"ORDER_FAILED";const status=["PRODUCT_NOT_FOUND","OUT_OF_STOCK","FRAME_UNAVAILABLE","COUPON_INVALID","COUPON_EXPIRED","COUPON_LIMIT"].includes(message)?409:500;return NextResponse.json({error:message==="OUT_OF_STOCK"?"One or more selected sizes are out of stock.":message==="PRODUCT_NOT_FOUND"?"A selected product is no longer available.":message==="FRAME_UNAVAILABLE"?"Framing is not available for a selected artwork.":message==="COUPON_INVALID"?"That coupon is not valid.":message==="COUPON_EXPIRED"?"That coupon has expired.":message==="COUPON_LIMIT"?"That coupon has reached its usage limit.":message==="MongoDB is not configured."?"Database is not configured. Please contact support.":"Could not create order."},{status});}
}
