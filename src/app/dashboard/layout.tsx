import { ProStatusProvider } from "@/context/pro-status-provider";
import { getUserStatus } from "@/lib/actions/users";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get initial Pro status server-side
  const { isPro = false } = await getUserStatus();

  return (
    <ProStatusProvider initialIsPro={isPro}>
      {children}
    </ProStatusProvider>
  );
} 