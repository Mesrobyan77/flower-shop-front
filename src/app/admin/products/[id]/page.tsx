import { ProductForm } from '@/components/admin/ProductsAdmin';

export default function AdminProductFormPage({ params }: { params: { id: string } }) {
  return <ProductForm id={params.id} />;
}
