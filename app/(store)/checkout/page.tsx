import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { getSettings } from "@/lib/settings";
export default async function CheckoutPage(){
  const settings = await getSettings();
  return <CheckoutClient freeShippingThreshold={settings.freeShippingThreshold} shippingFee={settings.shippingFee}/>
}
