import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderLookupPage({ params }: PageProps) {
  const { orderId } = await params;
  redirect(`/track?id=${encodeURIComponent(orderId)}`);
}
