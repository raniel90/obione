import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function makeSchema(maxBody: number) {
  return z.object({
    title: z.string().max(255, "Máximo de 255 caracteres").optional(),
    body: z
      .string()
      .min(1, "Corpo não pode ser vazio")
      .max(maxBody, `Máximo de ${maxBody} caracteres`),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

interface Props {
  defaultBody: string;
  defaultTitle?: string;
  onSubmit: (v: { title: string; body: string }) => void | Promise<unknown>;
  onCancel: () => void;
  pending?: boolean;
  /** Max body length — synthesis bodies allow more than drafts (8000 vs 4000). */
  maxBody?: number;
}

export function DraftForm({
  defaultBody,
  defaultTitle = "",
  onSubmit,
  onCancel,
  pending,
  maxBody = 4000,
}: Props) {
  const schema = useMemo(() => makeSchema(maxBody), [maxBody]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: defaultTitle, body: defaultBody },
  });

  function submit(values: FormValues) {
    onSubmit({ title: values.title ?? "", body: values.body });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-2">
      <Input {...register("title")} aria-label="Título" placeholder="Título (opcional)" />
      {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      <Textarea {...register("body")} aria-label="Corpo do draft" rows={3} />
      {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
