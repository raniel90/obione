import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  body: z.string().min(1, "Comentário não pode ser vazio").max(4000, "Máximo de 4000 caracteres"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (body: string) => void;
  defaultValue?: string;
  submitLabel?: string;
  onCancel?: () => void;
  pending?: boolean;
}

export function CommentForm({
  onSubmit,
  defaultValue = "",
  submitLabel = "Comentar",
  onCancel,
  pending,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { body: defaultValue },
  });

  function submit(values: FormValues) {
    onSubmit(values.body);
    if (!onCancel) reset({ body: "" }); // modo criar: limpa após enviar
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-2">
      <Textarea
        {...register("body")}
        aria-label="Comentário"
        placeholder="Escreva um comentário…"
        rows={3}
      />
      {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Enviando…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
