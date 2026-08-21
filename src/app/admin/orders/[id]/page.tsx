import { OrderDetailAdmin } from '@/components/admin/OrdersAdmin';

export default function AdminOrderPage({ params }: { params: { id: string } }) {
  return <OrderDetailAdmin id={params.id} />;
}
