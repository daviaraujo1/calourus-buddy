import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, ArrowLeft, Users, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: context.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Usuários", icon: Users },
  { to: "/admin/flashcards", label: "Flashcards", icon: Layers },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Até logo!");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-marinho font-display font-bold text-primary-foreground">
              C
            </span>
            <span className="font-display text-lg font-bold text-marinho">Calourus</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-marinho hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" /> Painel do estudante
            </Link>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-marinho hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-6">
          {TABS.map((tab) => {
            const active = location.pathname === tab.to;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "border-laranja text-marinho"
                    : "border-transparent text-muted-foreground hover:text-marinho"
                }`}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
