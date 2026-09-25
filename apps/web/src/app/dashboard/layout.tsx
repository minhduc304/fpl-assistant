import { Space_Grotesk } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./dashboard-theme.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
  subsets: ["latin"],
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`dashboard-brutalist ${spaceGrotesk.variable}`}>
      <TooltipProvider>{children}</TooltipProvider>
    </div>
  );
}
