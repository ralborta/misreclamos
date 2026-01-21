import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  try {
    const session = await getSession();
    if (session.user) {
      redirect("/tickets");
    }
    redirect("/login");
  } catch (error) {
    // Si hay error (ej: DB no configurada), redirigir a login
    console.error("Error en página principal:", error);
    redirect("/login");
  }
}
