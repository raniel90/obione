import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ClipboardList,
  MessageSquare,
  BookOpen,
  ArrowDown,
  Users,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ObiOneMark } from "@/components/obione-logo";
import { cn } from "@/lib/utils";

// The observação → conversa → aprendizado cycle, using the SAME icons and tones
// as the activity feed so the concept reads consistently across the app.
const cycle = [
  {
    icon: ClipboardList,
    tone: "text-info bg-info/10",
    label: "Observação",
    desc: "Alguém registra algo que notou em um projeto.",
  },
  {
    icon: MessageSquare,
    tone: "text-warning bg-warning/10",
    label: "Conversa",
    desc: "A comunidade conversa sobre essa observação.",
  },
  {
    icon: BookOpen,
    tone: "text-success bg-success/10",
    label: "Aprendizado",
    desc: "O que se conclui vira um aprendizado reaproveitável.",
  },
] as const;

const concepts = [
  {
    icon: Users,
    label: "Comunidade",
    desc: "Reúne os projetos de uma área de atuação. É onde as conversas acontecem.",
  },
  {
    icon: Eye,
    label: "Projeto",
    desc: "Um caso de cliente observado. Cada observação nasce aqui.",
  },
  {
    icon: ShieldCheck,
    label: "Papéis",
    desc: "Consultoria e clientes participam juntos, e cada um vê o que lhe cabe.",
  },
] as const;

type Step = {
  title: string;
  description: string;
  body: React.ReactNode;
};

const steps: Step[] = [
  {
    title: "Bem-vindo ao ObiOne",
    description: "O observatório dos projetos da consultoria, em um só lugar.",
    body: (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
          <ObiOneMark size={28} />
        </div>
        <p className="max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
          A consultoria <span className="text-foreground">observa</span> seus projetos,{" "}
          <span className="text-foreground">conversa</span> sobre o que encontra e transforma isso
          em <span className="text-foreground">aprendizados</span> que servem para os próximos. O
          ObiOne reúne esse ciclo em um só lugar.
        </p>
      </div>
    ),
  },
  {
    title: "Como o conhecimento se forma",
    description: "Três passos, do que se vê ao que se reaproveita.",
    body: (
      <div className="flex flex-col gap-1 py-1">
        {cycle.map((c, i) => (
          <div key={c.label} className="flex flex-col gap-1">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  c.tone,
                )}
              >
                <c.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{c.label}</p>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            </div>
            {i < cycle.length - 1 && (
              <div className="flex justify-center text-muted-foreground/50">
                <ArrowDown className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Como o ObiOne se organiza",
    description: "Os termos que você vai encontrar pela frente.",
    body: (
      <div className="flex flex-col gap-2 py-1">
        {concepts.map((c) => (
          <div
            key={c.label}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <c.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground">{c.label}</p>
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export function OnboardingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  // Always start from the first step whenever the dialog is opened.
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-5">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5" aria-hidden>
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all",
                i === step ? "w-6 bg-foreground" : "w-2 bg-border",
              )}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <DialogTitle className="text-[17px] leading-tight tracking-tight">
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] leading-relaxed">
            {current.description}
          </DialogDescription>
        </div>

        <div>{current.body}</div>

        <div className="flex items-center justify-between gap-2">
          {isLast ? (
            <span />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-[12px] text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              Pular
            </Button>
          )}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[12px]"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Voltar
              </Button>
            )}
            {isLast ? (
              <Button
                size="sm"
                className="text-[12px]"
                onClick={() => {
                  onOpenChange(false);
                  // O onboarding termina em ação: o ciclo começa num projeto.
                  navigate({ to: "/projects" });
                }}
              >
                Abrir os projetos
              </Button>
            ) : (
              <Button
                size="sm"
                className="text-[12px]"
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              >
                Avançar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
