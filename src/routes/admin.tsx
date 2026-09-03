import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { useAuth } from "@/lib/use-auth";
import {
  BOOKING_STATUSES,
  addGalleryItem,
  addRecentWork,
  addShopItem,
  deleteBooking,
  deleteContent,
  listBookings,
  listGallery,
  listRecentWork,
  listShop,
  updateBookingStatus,
  uploadMedia,
  type Booking,
  type BookingStatus,
} from "@/lib/content";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Toosh Tatoos" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <main className="admin-skin min-h-screen">
        <div className="relative mx-auto max-w-5xl px-5 py-20 text-xs uppercase tracking-[0.3em] text-[#8f7647]">
          Checking access…
        </div>
      </main>
    );
  }

  if (!isAdmin) return <Navigate to="/" />;

  return <Admin />;
}

// ---------------------------------------------------------------------------

type FieldDef = { name: string; label: string; required?: boolean };

type TableRow = { id: string; image_url: string; cells: string[] };

function RetroButton({
  active = false,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 border-black px-4 py-2 font-display text-xs uppercase tracking-[0.15em] shadow-[3px_3px_0_0_#000] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#000] ${
        active ? "bg-[#e8b84b] text-black" : "bg-[#2a2011] text-[#e8b84b]"
      }`}
    >
      {children}
    </button>
  );
}

function AddForm({
  fields,
  onAdd,
}: {
  fields: FieldDef[];
  onAdd: (values: Record<string, string>, imageUrl: string) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Pick an image first.");
      const imageUrl = await uploadMedia(file);
      await onAdd(values, imageUrl);
    },
    onSuccess: () => {
      setFile(null);
      setValues({});
      setError(null);
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    },
  });

  const labelClass =
    "block text-[0.65rem] font-bold uppercase tracking-[0.25em] text-[#8f7647]";
  const inputClass =
    "mt-2 w-full border-2 border-[#3a2c14] bg-[#0f0b06] px-3 py-2 text-sm text-[#e6d6b3] outline-none focus:border-[#e8b84b]";

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div>
        <label htmlFor="admin-file" className={labelClass}>
          Image
        </label>
        <input
          id="admin-file"
          ref={fileRef}
          type="file"
          accept="image/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className={`${inputClass} file:mr-3 file:border-0 file:bg-[#e8b84b] file:px-3 file:py-1 file:font-bold file:uppercase file:text-black`}
        />
      </div>

      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`admin-${f.name}`} className={labelClass}>
            {f.label}
          </label>
          <input
            id={`admin-${f.name}`}
            type="text"
            required={f.required}
            value={values[f.name] ?? ""}
            onChange={(e) =>
              setValues((s) => ({ ...s, [f.name]: e.target.value }))
            }
            className={inputClass}
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full border-2 border-black bg-[#e8b84b] px-6 py-3 font-display text-sm uppercase tracking-[0.15em] text-black shadow-[4px_4px_0_0_#000] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#000] disabled:opacity-60"
      >
        {mutation.isPending ? "Uploading…" : "Save"}
      </button>

      {error && (
        <p className="border-2 border-black bg-[#7a1f1f] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#f2e3c4]">
          {error}
        </p>
      )}
    </form>
  );
}

function RecordsTable({
  columns,
  rows,
  pendingId,
  onDelete,
}: {
  columns: string[];
  rows: TableRow[];
  pendingId: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto border-t-2 border-[#3a2c14]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#0f0b06] text-left font-display uppercase tracking-[0.15em] text-[#c98a2b]">
            <th className="px-4 py-3">Image</th>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3">
                {c}
              </th>
            ))}
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 2}
                className="px-4 py-8 text-center text-xs uppercase tracking-[0.3em] text-[#7a663f]"
              >
                Nothing here yet
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-[#2a2011] odd:bg-[#120d07]"
              >
                <td className="px-4 py-3">
                  <img
                    src={r.image_url}
                    alt=""
                    className="h-14 w-14 border-2 border-black object-cover"
                  />
                </td>
                {r.cells.map((cell, i) => (
                  <td key={i} className="px-4 py-3 text-[#e6d6b3]">
                    {cell || "—"}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={pendingId === r.id}
                    onClick={() => onDelete(r.id)}
                    className="border-2 border-black bg-[#7a1f1f] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[#f2e3c4] disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdminSection({
  title,
  subtitle,
  count,
  columns,
  rows,
  fields,
  pendingId,
  onAdd,
  onDelete,
}: {
  title: string;
  subtitle: string;
  count: number;
  columns: string[];
  rows: TableRow[];
  fields: FieldDef[];
  pendingId: string | null;
  onAdd: (values: Record<string, string>, imageUrl: string) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [view, setView] = useState<null | "table" | "add">(null);

  return (
    <section className="border-2 border-[#3a2c14] bg-[#15100a]">
      <div className="leopard-bar h-2 w-full border-b-2 border-black" />
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-[0.1em] text-[#e8b84b]">
            {title}
          </h2>
          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-[#8f7647]">
            {subtitle} · {count} item{count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <RetroButton
            active={view === "table"}
            onClick={() => setView((v) => (v === "table" ? null : "table"))}
          >
            {view === "table" ? "Hide table" : "View table"}
          </RetroButton>
          <RetroButton
            active={view === "add"}
            onClick={() => setView((v) => (v === "add" ? null : "add"))}
          >
            + Add
          </RetroButton>
        </div>
      </div>

      {view === "table" && (
        <RecordsTable
          columns={columns}
          rows={rows}
          pendingId={pendingId}
          onDelete={onDelete}
        />
      )}

      {view === "add" && (
        <div className="border-t-2 border-[#3a2c14] p-5">
          <AddForm
            fields={fields}
            onAdd={async (v, url) => {
              await onAdd(v, url);
              setView("table");
            }}
          />
        </div>
      )}
    </section>
  );
}

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "text-[#e8b84b]",
  contacted: "text-[#7fb3d5]",
  booked: "text-[#8fce8f]",
  declined: "text-[#c98a8a]",
};

function BookingsSection({
  bookings,
  isLoading,
  pendingId,
  onStatus,
  onDelete,
}: {
  bookings: Booking[];
  isLoading: boolean;
  pendingId: string | null;
  onStatus: (id: string, status: BookingStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const newCount = bookings.filter((b) => b.status === "new").length;

  return (
    <section className="border-2 border-[#3a2c14] bg-[#15100a]">
      <div className="leopard-bar h-2 w-full border-b-2 border-black" />
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-[0.1em] text-[#e8b84b]">
            Bookings
          </h2>
          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-[#8f7647]">
            Session requests from the contact form · {bookings.length} total
            {newCount > 0 ? ` · ${newCount} new` : ""}
          </p>
        </div>
        <RetroButton active={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Hide table" : "View table"}
        </RetroButton>
      </div>

      {open && (
        <div className="overflow-x-auto border-t-2 border-[#3a2c14]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#0f0b06] text-left font-display uppercase tracking-[0.15em] text-[#c98a2b]">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3">Idea</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-xs uppercase tracking-[0.3em] text-[#7a663f]"
                  >
                    {isLoading ? "Loading…" : "No bookings yet"}
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t border-[#2a2011] align-top odd:bg-[#120d07]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[#b99a63]">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-[#e6d6b3]">{b.name}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${b.email}`}
                        className="text-[#e8b84b] underline"
                      >
                        {b.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-[#e6d6b3]">
                      {b.placement || "—"}
                    </td>
                    <td className="max-w-xs px-4 py-3 whitespace-pre-wrap text-[#e6d6b3]">
                      {b.idea || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={b.status}
                        disabled={pendingId === b.id}
                        onChange={(e) =>
                          onStatus(b.id, e.target.value as BookingStatus)
                        }
                        className={`border-2 border-[#3a2c14] bg-[#0f0b06] px-2 py-1 text-xs font-bold uppercase ${STATUS_STYLE[b.status]}`}
                      >
                        {BOOKING_STATUSES.map((s) => (
                          <option key={s} value={s} className="text-[#e6d6b3]">
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={pendingId === b.id}
                        onClick={() => onDelete(b.id)}
                        className="border-2 border-black bg-[#7a1f1f] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[#f2e3c4] disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

function Admin() {
  const qc = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const recentWork = useQuery({
    queryKey: ["recent_work"],
    queryFn: listRecentWork,
  });
  const gallery = useQuery({
    queryKey: ["gallery_items"],
    queryFn: listGallery,
  });
  const shop = useQuery({ queryKey: ["shop_items"], queryFn: listShop });

  const bookings = useQuery({ queryKey: ["bookings"], queryFn: listBookings });

  const removeMutation = useMutation({
    mutationFn: ({
      table,
      id,
    }: {
      table: "recent_work" | "gallery_items" | "shop_items";
      id: string;
    }) => deleteContent(table, id),
    onMutate: ({ id }) => setPendingId(id),
    onSettled: (_d, _e, { table }) => {
      setPendingId(null);
      void qc.invalidateQueries({ queryKey: [table] });
    },
  });

  const bookingStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      updateBookingStatus(id, status),
    onMutate: ({ id }) => setPendingId(id),
    onSettled: () => {
      setPendingId(null);
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const bookingDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteBooking(id),
    onMutate: (id) => setPendingId(id),
    onSettled: () => {
      setPendingId(null);
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  return (
    <main className="admin-skin min-h-screen">
      <div className="relative mx-auto max-w-5xl px-5 py-14">
        <header className="mb-10">
          <div className="leopard-bar h-3 w-40 border-2 border-black" />
          <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,4.5rem)] uppercase leading-none tracking-tight text-[#e8b84b] [text-shadow:4px_4px_0_#000]">
            Admin
          </h1>
          <p className="mt-3 max-w-xl text-[0.7rem] uppercase tracking-[0.3em] text-[#b99a63]">
            Recent work · gallery · shop · bookings — changes go live
            immediately
          </p>
        </header>

        <div className="space-y-6">
          <AdminSection
            title="Recent Work"
            subtitle="Home page grid"
            count={recentWork.data?.length ?? 0}
            columns={["Title", "Meta"]}
            rows={(recentWork.data ?? []).map((r) => ({
              id: r.id,
              image_url: r.image_url,
              cells: [r.title, r.meta ?? ""],
            }))}
            fields={[
              { name: "title", label: "Title", required: true },
              { name: "meta", label: "Meta (e.g. Forearm · blackwork)" },
            ]}
            pendingId={pendingId}
            onAdd={async (v, image_url) => {
              await addRecentWork({
                title: v["title"] ?? "",
                meta: v["meta"] ?? "",
                image_url,
              });
              await qc.invalidateQueries({ queryKey: ["recent_work"] });
            }}
            onDelete={(id) =>
              removeMutation.mutate({ table: "recent_work", id })
            }
          />

          <AdminSection
            title="Gallery"
            subtitle="Gallery page grid"
            count={gallery.data?.length ?? 0}
            columns={["Title", "Meta"]}
            rows={(gallery.data ?? []).map((r) => ({
              id: r.id,
              image_url: r.image_url,
              cells: [r.title, r.meta ?? ""],
            }))}
            fields={[
              { name: "title", label: "Title", required: true },
              { name: "meta", label: "Meta (e.g. Ribs · blackwork)" },
            ]}
            pendingId={pendingId}
            onAdd={async (v, image_url) => {
              await addGalleryItem({
                title: v["title"] ?? "",
                meta: v["meta"] ?? "",
                image_url,
              });
              await qc.invalidateQueries({ queryKey: ["gallery_items"] });
            }}
            onDelete={(id) =>
              removeMutation.mutate({ table: "gallery_items", id })
            }
          />

          <AdminSection
            title="Shop"
            subtitle="Shop page products"
            count={shop.data?.length ?? 0}
            columns={["Name", "Price", "Tag", "Description"]}
            rows={(shop.data ?? []).map((r) => ({
              id: r.id,
              image_url: r.image_url,
              cells: [r.name, r.price ?? "", r.tag ?? "", r.description ?? ""],
            }))}
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "price", label: "Price (e.g. ¥3,500)" },
              { name: "tag", label: "Tag (e.g. New)" },
              { name: "description", label: "Description" },
            ]}
            pendingId={pendingId}
            onAdd={async (v, image_url) => {
              await addShopItem({
                name: v["name"] ?? "",
                price: v["price"] ?? "",
                tag: v["tag"] ?? "",
                description: v["description"] ?? "",
                image_url,
              });
              await qc.invalidateQueries({ queryKey: ["shop_items"] });
            }}
            onDelete={(id) =>
              removeMutation.mutate({ table: "shop_items", id })
            }
          />

          <BookingsSection
            bookings={bookings.data ?? []}
            isLoading={bookings.isLoading}
            pendingId={pendingId}
            onStatus={(id, status) =>
              bookingStatusMutation.mutate({ id, status })
            }
            onDelete={(id) => bookingDeleteMutation.mutate(id)}
          />
        </div>
      </div>
    </main>
  );
}
