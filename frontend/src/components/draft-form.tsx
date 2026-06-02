import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  title: z.string().max(255, "Máximo de 255 caracteres").optional(),
  body: z.string().min(1, "Corpo não pode ser vazio").max(4000, "Máximo de 4000 caracteres"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  defaultBody: string;
  defaultTitle?: string;
  onSubmit: (v: { title: string; body: string }) => void | Promise<unknown>;
  onCancel: () => void;
  pending?: boolean;
}

export function DraftForm({ defaultBody, defaultTitle = "", onSubmit, onCancel, pending }: Props) {
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
