import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProject } from "@/lib/queries/use-update-project";
import { DOMAIN_LABELS } from "@/lib/mpo/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Domain, Project } from "@/lib/api/types";

const DESCRIPTION_MIN = 200;
const DOMAINS = Object.keys(DOMAIN_LABELS) as Domain[];

const schema = z.object({
  name: z.string().min(1, "Informe um nome").max(255, "Máximo de 255 caracteres"),
  domain: z.enum(["legal", "health", "sports", "branding", "gastronomy", "other"]),
  description: z
    .string()
    .min(DESCRIPTION_MIN, `A descrição precisa de pelo menos ${DESCRIPTION_MIN} caracteres`)
    .max(8000, "Máximo de 8000 caracteres"),
});

type FormValues = z.infer<typeof schema>;

/** Staff action: edit a project's name / domain / description. */
export function EditProjectDialog({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const updateProject = useUpdateProject(project.id);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project.name,
      domain: project.domain,
      description: project.description,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await updateProject.mutateAsync(values);
      toast.success("Projeto atualizado");
      setOpen(false);
    } catch {
      toast.error("Não foi possível atualizar o projeto.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          reset({
            name: project.name,
            domain: project.domain,
            description: project.description,
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar projeto</DialogTitle>
          <DialogDescription>Atualize o nome, o domínio ou a descrição.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <Label htmlFor="edit-name">Nome</Label>
            <Input id="edit-name" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-domain">Domínio</Label>
            <Controller
              control={control}
              name="domain"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="edit-domain">
                    <SelectValue />
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
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              rows={8}
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
