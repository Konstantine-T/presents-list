import AdminPage from "./AdminPage";
import PublicPage from "./PublicPage";
import { supabase } from "./reservations";

export default function App() {
  if (!supabase) {
    return (
      <main>
        <p className="warn">
          Supabase არ არის დაკონფიგურირებული — შექმენი .env ფაილი (იხ.
          .env.example).
        </p>
      </main>
    );
  }
  const isAdmin = window.location.pathname.replace(/\/+$/, "") === "/admin";
  return isAdmin ? <AdminPage /> : <PublicPage />;
}
