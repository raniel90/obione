import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useClients } from "@/lib/queries/use-clients";
import { useAddProjectClient } from "@/lib/queries/use-add-project-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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

/**
 * Staff action: link a client user to a project. The client only sees the
 * project once linked AND given visibility via CBAC, so we nudge toward the
 * visibility page on success.
 */
export function LinkClientDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const clientsQ = useClients();
  const addClient = useAddProjectClient(projectId);

  function handleConfirm() {
    if (!userId) return;
    addClient.mutate(userId, {
      onSuccess: () => {
        toast.success("Cliente vinculado", {
          description: "Libere categorias em Configurar visibilidade para o cliente ver.",
        });
        setOpen(false);
        setUserId("");
      },
      onError: () => toast.error("Não foi possível vincular o cliente."),
    });
  }

  const clients = clientsQ.data ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="size-4" />
          Vincular cliente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular cliente</DialogTitle>
          <DialogDescription>
            Escolha o cliente que poderá acompanhar este projeto.
          </DialogDescription>
        </DialogHeader>

        {clientsQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando clientes…</p>
        ) : clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
        ) : (
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger aria-label="Cliente">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={!userId || addClient.isPending}>
            {addClient.isPending ? "Vinculando…" : "Vincular"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
