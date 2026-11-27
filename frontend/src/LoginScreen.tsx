import { useState, type FormEvent } from "react";
import { login } from "./api";
import type { Member } from "./types";

type LoginScreenProps = {
  onSuccess: (user: Member) => void;
};

export const LoginScreen = ({ onSuccess }: LoginScreenProps) => {
  const [email, setEmail] = useState("angel@pipeline.dev");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await login(email, password);
      onSuccess(result.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo entrar");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form className="flex w-full max-w-sm flex-col gap-6" onSubmit={handleSubmit}>
        <header className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Pipeline
          </p>
          <h1 className="text-3xl font-medium tracking-tight">Entra al tablero</h1>
          <p className="text-sm text-muted-foreground">
            Usa angel@pipeline.dev, cristian@pipeline.dev o camilo@pipeline.dev. La contraseña es
            pipeline.
          </p>
        </header>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="email">
          Correo
          <input
            id="email"
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="password">
          Contraseña
          <input
            id="password"
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="h-9 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          type="submit"
          disabled={pending}
        >
          Entrar
        </button>
      </form>
    </main>
  );
};
