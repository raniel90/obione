import { useParams } from "react-router-dom";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-bold">Projeto {id}</h1>
      <p className="mt-2 text-muted-foreground">
        Em construção — 44 atributos por categoria chegam no M2.
      </p>
    </div>
  );
}
