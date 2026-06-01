import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { useProjectDetail } from "@/lib/queries/use-project-detail";
import { useExtractions } from "@/lib/queries/use-extractions";
import { useUser } from "@/lib/auth-context";
import { groupAttributes } from "@/lib/mpo/group-attributes";
import { categoryCoverage } from "@/lib/mpo/coverage";
import { ApiError } from "@/lib/api/error";
import { AttributeAccordion } from "@/components/attribute-accordion";
import { CoverageBar } from "@/components/coverage-bar";
import { CommentsList } from "@/components/comments-list";
import { EvaluationPanel } from "@/components/evaluation-panel";
import { DomainBadge } from "@/components/domain-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function ProjectDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const user = useUser();
  const isStaff = user.role !== "client";

  const detailQ = useProjectDetail(id);
  const extractionsQ = useExtractions(id);

  const llmContent = useMemo(() => {
    const runs = extractionsQ.data ?? [];
    const llm = runs
      .filter((r) => r.source === "llm")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    return llm?.content;
  }, [extractionsQ.data]);

  const grouped = useMemo(() => (llmContent ? groupAttributes(llmContent) : []), [llmContent]);
  const catCoverage = useMemo(
    () => (isStaff && llmContent ? categoryCoverage(llmContent) : undefined),
    [isStaff, llmContent],
  );

  if (detailQ.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-12">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (detailQ.isError) {
    const status = detailQ.error instanceof ApiError ? detailQ.error.status : 0;
    if (status === 404) {
      return (
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">Projeto não encontrado</h1>
          <p className="mt-2 text-muted-foreground">
            Ele não existe ou você não tem acesso.
          </p>
          <Link to="/" className="mt-6 inline-block text-sm text-primary underline">
            Voltar ao início
          </Link>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="mb-3 text-destructive">Erro ao carregar o projeto.</p>
        <Button variant="outline" size="sm" onClick={() => detailQ.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  const detail = detailQ.data!;
  const project = detail.project;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <Link to="/projects" className="text-sm text-muted-foreground hover:underline">
          ← Projetos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <DomainBadge domain={project.domain} />
        </div>
        <p className="text-sm text-muted-foreground">
          Criado em {format(parseISO(project.created_at), "dd/MM/yyyy")}
        </p>
      </header>

      {isStaff && (
        <CoverageBar
          percentage={detail.coverage.percentage}
          filled={detail.coverage.filled}
          total={detail.coverage.total_in_scope}
        />
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Atributos do projeto</h2>
        {grouped.length === 0 ? (
          <p className="text-muted-foreground">Extração ainda não executada.</p>
        ) : (
          <AttributeAccordion categories={grouped} coverageByCategory={catCoverage} />
        )}
      </section>

      {isStaff && detail.evaluation && (
        <section>
          <Separator className="mb-4" />
          <h2 className="mb-3 text-lg font-semibold">Avaliação (LLM × gabarito)</h2>
          <EvaluationPanel evaluation={detail.evaluation} />
        </section>
      )}

      <section>
        <Separator className="mb-4" />
        <h2 className="mb-3 text-lg font-semibold">Comentários</h2>
        <CommentsList comments={detail.recent_comments} />
      </section>
    </div>
  );
}
