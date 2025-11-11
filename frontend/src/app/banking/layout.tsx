// src/app/banking/layout.tsx
"use client";

import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconRoute,
  IconChartBar,
  IconWallet,
  IconUsers,
} from "@tabler/icons-react";

const dockItems = [
  {
    title: "Routes",
    icon: <IconRoute className="h-full w-full" />,
    href: "/routes",
  },
  {
    title: "Compare",
    icon: <IconChartBar className="h-full w-full" />,
    href: "/compare",
  },
  {
    title: "Banking",
    icon: <IconWallet className="h-full w-full" />,
    href: "/banking",
  },
  {
    title: "Pooling",
    icon: <IconUsers className="h-full w-full" />,
    href: "/pooling",
  },
];

export default function BankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <FloatingDock
        items={dockItems}
        desktopClassName="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        mobileClassName="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      />
    </>
  );
}
