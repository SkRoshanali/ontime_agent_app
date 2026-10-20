import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Dashboard - Grocery Dispatch',
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
