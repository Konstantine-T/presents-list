import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ADMIN_EMAIL, sectionTitles, type Gift, type Section } from "./gifts";
import Linkified from "./Linkified";
import { supabase, useGifts, useReservations } from "./reservations";

// App only renders this page when supabase is configured
const db = supabase!;

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    db.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    const { data } = db.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!checked) return <main className="hint">იტვირთება...</main>;
  if (!session) return <Login />;
  if (session.user.email !== ADMIN_EMAIL) {
    return (
      <main>
        <p className="warn">ამ ანგარიშს ადმინის უფლება არ აქვს.</p>
        <button onClick={() => db.auth.signOut()}>გასვლა</button>
      </main>
    );
  }
  return <Editor />;
}

function Login() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await db.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
  };

  return (
    <main>
      <h1>ადმინი</h1>
      <form className="login" onSubmit={submit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ელფოსტა"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="პაროლი"
          required
          autoFocus
        />
        <button type="submit" disabled={busy}>
          შესვლა
        </button>
        {error && <p className="warn">{error}</p>}
      </form>
    </main>
  );
}

function Editor() {
  const { gifts, setGifts, error: giftsError, reload } = useGifts();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const { reserved } = useReservations();
  const [error, setError] = useState<string | null>(null);

  // runs a write, shows its error, then refreshes the list
  const run = async (write: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await write;
    setError(error?.message ?? null);
    await reload();
  };

  const add = (section: Section, text: string) => {
    const positions = gifts
      .filter((g) => g.section === section)
      .map((g) => g.position);
    const position = Math.max(0, ...positions) + 1;
    return run(db.from("gifts").insert({ section, text, position }));
  };

  const save = (id: string, text: string) =>
    run(db.from("gifts").update({ text }).eq("id", id));

  const remove = (gift: Gift) => {
    if (!confirm(`წავშალო?\n\n${gift.text}`)) return;
    run(db.from("gifts").delete().eq("id", gift.id));
  };

  const reorder = async (items: Gift[], { active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((g) => g.id === active.id);
    const to = items.findIndex((g) => g.id === over.id);
    const moved = arrayMove(items, from, to).map((g, i) => ({
      ...g,
      position: i + 1,
    }));
    const changed = moved.filter(
      (g) => g.position !== items.find((o) => o.id === g.id)?.position,
    );

    // show the new order right away, then save it
    const byId = new Map(moved.map((g) => [g.id, g]));
    setGifts(
      gifts
        .map((g) => byId.get(g.id) ?? g)
        .sort((a, b) => a.position - b.position),
    );
    const results = await Promise.all(
      changed.map((g) =>
        db.from("gifts").update({ position: g.position }).eq("id", g.id),
      ),
    );
    setError(results.find((r) => r.error)?.error?.message ?? null);
    await reload();
  };

  return (
    <main>
      <div className="admin-header">
        <h1>ადმინი</h1>
        <a href="/">საიტზე დაბრუნება</a>
        <button onClick={() => db.auth.signOut()}>გასვლა</button>
      </div>
      {(error || giftsError) && (
        <p className="warn">შეცდომა: {error || giftsError}</p>
      )}

      {(["birthday", "abroad"] as Section[]).map((section) => {
        const items = gifts.filter((g) => g.section === section);
        return (
          <section key={section}>
            <h2>{sectionTitles[section]}</h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => reorder(items, e)}
            >
              <SortableContext
                items={items.map((g) => g.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="admin-list">
                  {items.map((gift) => (
                    <AdminRow
                      key={gift.id}
                      gift={gift}
                      reserved={
                        section === "birthday" && reserved.has(gift.id)
                      }
                      onSave={(text) => save(gift.id, text)}
                      onDelete={() => remove(gift)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
            <AddForm onAdd={(text) => add(section, text)} />
          </section>
        );
      })}
    </main>
  );
}

function AdminRow(props: {
  gift: Gift;
  reserved: boolean;
  onSave: (text: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(props.gift.text);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.gift.id });

  const save = async () => {
    if (!text.trim()) return;
    await props.onSave(text.trim());
    setEditing(false);
  };

  return (
    <li
      ref={setNodeRef}
      className={isDragging ? "dragging" : undefined}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        ref={setActivatorNodeRef}
        className="drag-handle"
        title="გადაათრიე"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="row-body">
        {editing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
          />
        ) : (
          <span>
            <Linkified text={props.gift.text} />
            {props.reserved && <span className="badge">ვყიდულობ</span>}
          </span>
        )}
      </div>
      <div className="row-actions">
        {editing ? (
          <>
            <button onClick={save}>შენახვა</button>
            <button
              onClick={() => {
                setText(props.gift.text);
                setEditing(false);
              }}
            >
              გაუქმება
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)}>რედაქტირება</button>
            <button className="danger" onClick={props.onDelete}>
              წაშლა
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function AddForm({ onAdd }: { onAdd: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onAdd(text.trim());
    setText("");
  };

  return (
    <form className="add-form" onSubmit={submit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="ახალი საჩუქარი (ლინკიც შეიძლება)"
        rows={2}
      />
      <button type="submit">დამატება</button>
    </form>
  );
}
