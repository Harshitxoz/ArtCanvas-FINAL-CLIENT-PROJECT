import { CartClient } from "@/components/cart/CartClient";
import { getSettings } from "@/lib/settings";
export default async function CartPage(){
  const settings = await getSettings();
  return <CartClient freeShippingThreshold={settings.freeShippingThreshold} shippingFee={settings.shippingFee}/>
}
