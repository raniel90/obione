import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
      <Link to="/" className="mt-6 text-sm text-primary underline">
        Voltar ao início
      </Link>
    </div>
  );
}
