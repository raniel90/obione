import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCreateProject } from "@/lib/queries/use-create-project";
import { DOMAIN_LABELS } from "@/lib/mpo/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Domain } from "@/lib/api/types";

const DESCRIPTION_MIN = 200;
const DOMAINS = Object.keys(DOMAIN_LABELS) as Domain[];

const schema = z.object({
  name: z.string().min(1, "Informe um nome").max(255, "Máximo de 255 caracteres"),
  domain: z.enum(["legal", "health", "sports", "branding", "gastronomy", "other"], {
    message: "Selecione um domínio",
  }),
  description: z
    .string()
    .min(DESCRIPTION_MIN, `A descrição precisa de pelo menos ${DESCRIPTION_MIN} caracteres`)
    .max(8000, "Máximo de 8000 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const [descriptionLength, setDescriptionLength] = useState(0);
  const descriptionField = register("description");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const project = await createProject.mutateAsync(values);
      toast.success("Projeto criado");
      navigate(`/projects/${project.id}`);
    } catch {
      setServerError("Não foi possível criar o projeto. Revise os campos e tente de novo.");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-2">
        <nav className="text-sm text-muted-foreground" aria-label="Trilha">
          <Link to="/projects" className="hover:text-foreground hover:underline">
            Projetos
          </Link>
          <span className="px-1.5" aria-hidden>
            /
          </span>
          <span className="text-foreground">Novo projeto</span>
        </nav>
        <h1 className="text-2xl font-bold">Novo projeto</h1>
        <p className="text-sm text-muted-foreground">
          Cole a narrativa do projeto. A IA extrai os 44 atributos do MPO a partir dela.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-1">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="domain">Domínio</Label>
          <Controller
            control={control}
            name="domain"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="domain" aria-invalid={!!errors.domain}>
                  <SelectValue placeholder="Selecione um domínio" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DOMAIN_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.domain && (
            <p className="text-xs text-destructive">{errors.domain.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="description">Descrição (conteúdo do projeto)</Label>
            <span
              className={
                descriptionLength < DESCRIPTION_MIN
                  ? "text-xs text-muted-foreground"
                  : "text-xs text-success"
              }
            >
              {descriptionLength}/{DESCRIPTION_MIN}
            </span>
          </div>
          <Textarea
            id="description"
            rows={10}
            placeholder="Cole aqui a narrativa bruta do projeto (objetivos, stakeholders, escopo, cronograma, custos, riscos, lições aprendidas…)."
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "description-error" : undefined}
            {...descriptionField}
            onChange={(e) => {
              descriptionField.onChange(e);
              setDescriptionLength(e.target.value.length);
            }}
          />
          {errors.description && (
            <p id="description-error" className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        {serverError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando…" : "Criar projeto"}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link to="/projects">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
