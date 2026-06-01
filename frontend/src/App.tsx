import { ObiOneMark } from "@/components/obione-logo";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 px-6 py-32 text-center">
          <ObiOneMark size={48} />
          <h1 className="text-4xl font-bold tracking-tight">ObiOne</h1>
          <p className="text-lg text-muted-foreground">
            Observatório de Projetos para Consultorias — chassis do frontend.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
            M0 chassis no ar — login e cockpit chegam no M1/M5.
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
