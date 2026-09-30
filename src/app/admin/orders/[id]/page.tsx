import { OrderDetailAdmin } from '@/components/admin/OrdersAdmin';

export default async function AdminOrderPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <OrderDetailAdmin id={params.id} />;
}
