'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { cn, formatDate, formatNumber, formatPrice } from '@/lib/utils';
import { defaultLocale, getDictionary, pickLocalized } from '@/lib/i18n';
import { adminApi } from '@/lib/api/admin';
import { qk } from '@/lib/queryKeys';
import { Skeleton } from '@/components/ui/Feedback';
import { OrderStatusBadge } from '@/components/account/OrderPieces';
import { AdminCard, AdminPageHeader, AdminTable } from './AdminShell';
import type { OrderStatus } from '@/types';

export function AdminDashboard() {
  const dict = getDictionary(defaultLocale);
  const { data, isLoading } = useQuery({ queryKey: qk.adminStats, queryFn: adminApi.stats });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  const tiles = [
    { label: dict.admin.totalOrders, value: formatNumber(data.totals.orders), accent: 'text-brand' },
    { label: dict.admin.revenue, value: formatPrice(data.totals.revenue), accent: 'text-ink-strong' },
    { label: dict.admin.totalProducts, value: formatNumber(data.totals.activeProducts), accent: 'text-olive-dark' },
    { label: dict.admin.totalUsers, value: formatNumber(data.totals.users), accent: 'text-ink-strong' },
  ];

  const maxRevenue = Math.max(1, ...data.daily.map((day) => day.revenue));

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={dict.admin.dashboard} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <AdminCard key={tile.label}>
            <p className="text-[11.5px] text-ink-soft">{tile.label}</p>
            <p className={cn('mt-1.5 text-[22px] font-semibold tracking-tight', tile.accent)}>{tile.value}</p>
          </AdminCard>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <AdminCard>
          <p className="text-[13px] font-semibold text-ink-strong">{dict.admin.monthRevenue}</p>
          <p className="mt-1 text-[20px] font-semibold text-brand">{formatPrice(data.month.revenue)}</p>

          <div className="mt-6 flex h-32 items-end gap-2">
            {data.daily.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-[3px] bg-brand/80 transition-all duration-base"
                  style={{ height: `${Math.max(4, (day.revenue / maxRevenue) * 100)}%` }}
                  title={`${day.date}: ${formatPrice(day.revenue)}`}
                />
                <span className="text-[9.5px] text-ink-faint">{day.date.slice(5)}</span>
              </div>
            ))}
            {data.daily.length === 0 && <p className="text-[12px] text-ink-faint">{dict.common.empty}</p>}
          </div>
        </AdminCard>

        <AdminCard>
          <p className="text-[13px] font-semibold text-ink-strong">{dict.account.orderStatus}</p>
          <ul className="mt-4 flex flex-col gap-2">
            {(Object.entries(data.statusCounts) as [OrderStatus, number][]).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between gap-3">
                <OrderStatusBadge status={status} dict={dict} />
                <span className="text-[13px] font-medium text-ink">{count}</span>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      <div>
        <AdminPageHeader
          title={dict.admin.recentOrders}
          action={
            <Link href="/admin/orders" className="text-[12px] text-brand hover:underline">
              {dict.common.seeAll}
            </Link>
          }
        />
        <AdminTable head={['#', dict.checkout.customer, dict.account.orderDate, dict.account.orderTotal, dict.account.orderStatus]}>
          {data.recentOrders.map((order) => (
            <tr key={order.id} className="text-[12.5px]">
              <td className="px-4 py-3">
                <Link href={`/admin/orders/${order.id}`} className="font-medium text-brand hover:underline">
                  {order.code}
                </Link>
              </td>
              <td className="px-4 py-3">{order.customer.name}</td>
              <td className="px-4 py-3 text-ink-soft">{formatDate(order.createdAt, defaultLocale, true)}</td>
              <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} dict={dict} />
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <div>
        <AdminPageHeader title={dict.admin.topProducts} />
        <AdminTable head={[dict.cart.item, dict.product.price, dict.home.bestSellers, dict.product.tabReviews]}>
          {data.topProducts.map((product) => (
            <tr key={product.id} className="text-[12.5px]">
              <td className="px-4 py-3">{pickLocalized(product.name, defaultLocale)}</td>
              <td className="px-4 py-3">{formatPrice(product.price)}</td>
              <td className="px-4 py-3">{product.soldCount}</td>
              <td className="px-4 py-3">{product.ratingAverage.toFixed(1)}</td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
