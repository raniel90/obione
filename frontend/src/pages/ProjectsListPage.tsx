import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { FolderOpen } from "lucide-react";
import { useProjects } from "@/lib/queries/use-projects";
import { DomainBadge } from "@/components/domain-badge";
import { EmptyState } from "@/components/empty-state";
import { DOMAIN_LABELS } from "@/lib/mpo/catalog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Domain } from "@/lib/api/types";

const DOMAINS = Object.keys(DOMAIN_LABELS) as Domain[];

export function ProjectsListPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useProjects();
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const domainParam = searchParams.get("domain");
  const initialDomain: Domain | "all" =
    domainParam && domainParam in DOMAIN_LABELS ? (domainParam as Domain) : "all";
  const [domain, setDomain] = useState<Domain | "all">(initialDomain);

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    return list.filter(
      (p) =>
        (q === "" || p.name.toLowerCase().includes(q)) &&
        (domain === "all" || p.domain === domain),
    );
  }, [data, search, domain]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Projetos</h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={domain} onValueChange={(v) => setDomain(v as Domain | "all")}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Domínio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os domínios</SelectItem>
            {DOMAINS.map((d) => (
              <SelectItem key={d} value={d}>
                {DOMAIN_LABELS[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <p className="mb-2 text-destructive">Erro ao carregar projetos.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          message={
            (data ?? []).length === 0
              ? "Nenhum projeto ainda."
              : "Nenhum projeto encontrado."
          }
          description={
            (data ?? []).length === 0
              ? undefined
              : "Ajuste a busca ou o filtro de domínio."
          }
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Domínio</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow
                key={p.id}
                className="cursor-pointer"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <DomainBadge domain={p.domain} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(parseISO(p.created_at), "dd/MM/yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
