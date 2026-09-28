import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Gift } from "./gifts";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && key ? createClient(url, key) : null;

// loads rows from a table and reloads whenever it changes (for every open page)
function useLiveTable<T>(table: string, columns: string, order?: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!supabase) return;
    let query = supabase.from(table).select(columns);
    if (order) query = query.order(order);
    const { data, error } = await query;
    if (error) setError(error.message);
    else {
      setError(null);
      setRows(data as T[]);
    }
    setLoading(false);
  }, [table, columns, order]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    reload();
    const channel = client
      .channel(`live-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, reload)
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [table, reload]);

  return { rows, setRows, loading, error, setError, reload };
}

export function useGifts() {
  const { rows, setRows, loading, error, reload } = useLiveTable<Gift>(
    "gifts",
    "id, section, position, text",
    "position",
  );
  return { gifts: rows, setGifts: setRows, loading, error, reload };
}

export function useReservations() {
  const { rows, setRows, loading, error, setError } = useLiveTable<{
    gift_id: string;
  }>("reservations", "gift_id");
  const reserved = new Set(rows.map((r) => r.gift_id));

  const toggle = async (id: string) => {
    if (!supabase) return;
    const prev = rows;
    const wasReserved = reserved.has(id);
    setRows(
      wasReserved ? rows.filter((r) => r.gift_id !== id) : [...rows, { gift_id: id }],
    );
    const { error } = wasReserved
      ? await supabase.from("reservations").delete().eq("gift_id", id)
      : await supabase.from("reservations").upsert({ gift_id: id });
    if (error) {
      setError(error.message);
      setRows(prev);
    }
  };

  return { reserved, toggle, loading, error };
}
