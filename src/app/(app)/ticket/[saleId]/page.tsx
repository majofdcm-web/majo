import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getSale } from "@/lib/store";
import TicketView from "@/components/ticket-view";

export default async function TicketPage({ params }: { params: Promise<{ saleId: string }> }) {
  const { saleId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const sale = getSale(saleId);
  if (!sale) redirect("/mesas");

  return <TicketView sale={sale} />;
}
