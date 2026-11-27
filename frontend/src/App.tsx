import { useEffect, useState } from "react";
import { fetchSession } from "./api";
import { BoardScreen } from "./BoardScreen";
import { LoginScreen } from "./LoginScreen";
import type { Member } from "./types";

export const App = () => {
  const [user, setUser] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    document.documentElement.classList.toggle("dark", stored === "dark");
    const run = async () => {
      try {
        setUser(await fetchSession());
      } finally {
        setReady(true);
      }
    };
    void run();
  }, []);

  if (!ready) {
    return <p className="px-6 py-8 text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!user) return <LoginScreen onSuccess={setUser} />;

  return <BoardScreen user={user} onLogout={() => setUser(null)} />;
};
