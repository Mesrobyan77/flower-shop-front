import { ProductForm } from '@/components/admin/ProductsAdmin';

export default async function AdminProductFormPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <ProductForm id={params.id} />;
}
