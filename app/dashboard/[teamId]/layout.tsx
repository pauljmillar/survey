'use client';

import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { useUser } from "@clerk/nextjs";
import { BadgePercent, BarChart4, Columns3, Globe, Locate, Settings2, ShoppingBag, ShoppingCart, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { TeamSwitcher } from "@/components/team-switcher";

const navigationItems: SidebarItem[] = [
  {
    name: "Overview",
    href: "/",
    icon: Globe,
    type: "item",
  },
  {
    type: 'label',
    name: 'Management',
  },
  {
    name: "Products",
    href: "/products",
    icon: ShoppingBag,
    type: "item",
  },
  {
    name: "People",
    href: "/people",
    icon: Users,
    type: "item",
  },
  {
    name: "Segments",
    href: "/segments",
    icon: Columns3,
    type: "item",
  },
  {
    name: "Regions",
    href: "/regions",
    icon: Locate,
    type: "item",
  },
  {
    type: 'label',
    name: 'Monetization',
  },
  {
    name: "Revenue",
    href: "/revenue",
    icon: BarChart4,
    type: "item",
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    type: "item",
  },
  {
    name: "Discounts",
    href: "/discounts",
    icon: BadgePercent,
    type: "item",
  },
  {
    type: 'label',
    name: 'Settings',
  },
  {
    name: "Configuration",
    href: "/configuration",
    icon: Settings2,
    type: "item",
  },
];

export default function Layout(props: { children: React.ReactNode }) {
  const params = useParams<{ teamId: string }>();
  const { user } = useUser();
  const router = useRouter();

  // For now, we'll use the teamId from params directly
  // You can add team validation logic here later
  const teamId = params.teamId;
  const selectedTeam = { id: teamId, displayName: `Team ${teamId}` };

  const handleTeamChange = (newTeamId: string) => {
    router.push(`/dashboard/${newTeamId}`);
  };

  return (
    <SidebarLayout 
      items={navigationItems}
      basePath={`/dashboard/${teamId}`}
      sidebarTop={<TeamSwitcher 
        selectedTeamId={teamId}
        onTeamChange={handleTeamChange}
      />}
      baseBreadcrumb={[{
        title: selectedTeam.displayName,
        href: `/dashboard/${teamId}`,
      }]}
    >
      {props.children}
    </SidebarLayout>
  );
}