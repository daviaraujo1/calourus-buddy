import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Users, GraduationCap, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — Calourus" },
      {
        name: "description",
        content: "Gerencie estudantes e permissões de administrador na Calourus.",
      },
    ],
  }),
  component: AdminUsersPage,
});

type Row = {
  id: string;
  email: string | null;
  fullName: string | null;
  course: string | null;
  university: string | null;
  createdAt: string;
  isAdmin: boolean;
};

function AdminUsersPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function loadData() {
    setLoadError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, course, university, created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    if (profilesRes.error) {
      setLoadError(profilesRes.error.message);
      return;
    }
    if (rolesRes.error) {
      setLoadError(rolesRes.error.message);
      return;
    }

    const adminIds = new Set(
      (rolesRes.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
    );

    const merged: Row[] = (profilesRes.data ?? [])
      .map((p) => ({
        id: p.id,
        email: p.email,
        fullName: p.full_name,
        course: p.course,
        university: p.university,
        createdAt: p.created_at,
        isAdmin: adminIds.has(p.id),
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    setRows(merged);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function toggleAdmin(row: Row) {
    setPendingId(row.id);
    try {
      if (row.isAdmin) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", row.id)
          .eq("role", "admin");
        if (error) throw error;
        toast.success(`${row.fullName || row.email || "Usuário"} não é mais administrador.`);
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: row.id, role: "admin" });
        if (error) throw error;
        toast.success(`${row.fullName || row.email || "Usuário"} agora é administrador.`);
      }
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar permissão.";
      toast.error(msg);
    } finally {
      setPendingId(null);
    }
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.fullName, r.email, r.course, r.university]
        .filter((field): field is string => !!field)
        .some((field) => field.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    if (!rows) return { total: 0, admins: 0, courses: 0 };
    return {
      total: rows.length,
      admins: rows.filter((r) => r.isAdmin).length,
      courses: new Set(rows.map((r) => r.course).filter(Boolean)).size,
    };
  }, [rows]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-3xl bg-gradient-to-br from-marinho to-marinho-soft p-10 text-primary-foreground shadow-[var(--shadow-elegant)]">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest">
          <ShieldCheck className="h-3.5 w-3.5" /> Painel administrativo
        </span>
        <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
          Quem está chegando na <span className="text-laranja">Calourus</span>
        </h1>
        <p className="mt-2 max-w-lg text-white/80">
          Acompanhe os estudantes cadastrados e gerencie quem tem acesso administrativo.
        </p>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Estudantes cadastrados" value={stats.total} />
        <StatCard icon={ShieldCheck} label="Administradores" value={stats.admins} />
        <StatCard icon={GraduationCap} label="Cursos representados" value={stats.courses} />
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-bold text-marinho">Usuários</h2>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou curso…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)]">
          {rows === null && !loadError && (
            <p className="p-8 text-center text-sm text-muted-foreground">Carregando usuários…</p>
          )}
          {loadError && <p className="p-8 text-center text-sm text-destructive">{loadError}</p>}
          {rows !== null && !loadError && filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {search
                ? "Nenhum usuário encontrado para essa busca."
                : "Ainda não há estudantes cadastrados."}
            </p>
          )}
          {rows !== null && !loadError && filtered.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Curso / Universidade</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-marinho">{row.fullName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[row.course, row.university].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {row.isAdmin ? (
                        <Badge variant="outline" className="border-laranja/40 bg-laranja-soft text-marinho">
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Estudante</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <RoleToggle
                        row={row}
                        disabled={row.id === currentUserId && row.isAdmin}
                        pending={pendingId === row.id}
                        onConfirm={() => toggleAdmin(row)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
      <Icon className="h-7 w-7 text-laranja" strokeWidth={1.75} />
      <p className="mt-4 font-display text-3xl font-bold text-marinho">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function RoleToggle({
  row,
  disabled,
  pending,
  onConfirm,
}: {
  row: Row;
  disabled: boolean;
  pending: boolean;
  onConfirm: () => void;
}) {
  if (disabled) {
    return (
      <span
        className="text-xs text-muted-foreground"
        title="Você não pode remover seu próprio acesso de administrador."
      >
        Você
      </span>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={row.isAdmin ? "outline" : "secondary"} size="sm" disabled={pending}>
          {row.isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          {row.isAdmin ? "Remover admin" : "Tornar admin"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {row.isAdmin ? "Remover acesso administrativo?" : "Conceder acesso administrativo?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {row.isAdmin
              ? `${row.fullName || row.email || "Este usuário"} perderá acesso ao painel administrativo.`
              : `${row.fullName || row.email || "Este usuário"} poderá ver todos os estudantes e gerenciar permissões de administrador.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
