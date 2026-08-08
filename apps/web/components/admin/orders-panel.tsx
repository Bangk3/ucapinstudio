"use client";

import { OrderForm } from "@/components/admin/order-form";
import { OrderQueue } from "@/components/admin/order-queue";
import { useState } from "react";

export function OrdersPanel({ canApprove }: { canApprove: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <OrderForm onCreated={() => setRefreshKey((k) => k + 1)} />
      <OrderQueue canApprove={canApprove} refreshKey={refreshKey} />
    </>
  );
}
