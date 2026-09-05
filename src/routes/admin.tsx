import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { useAuth } from "@/lib/use-auth";
import {
  BOOKING_STATUSES,
  FRAME_OPTIONS,
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
  type Frame,
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
        <div className="relative mx-auto max-w-5xl px-5 py-20 text-xs uppercase tracking-[0.3em] text-[#8a8a8a]">
          Checking access…
        </div>
      </main>
    );
  }

  if (!isAdmin) return <Navigate to="/" />;

  return <Admin />;
}

// --- shared bits ----------------------------------------------------------

type FieldDef = { name: string; label: string; required?: boolean };

type Item = {
  id: string;
  image_url: string;
  fields: { label: string; value: string }[];
};

function TabButton({
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
      className={`border px-4 py-1.5 font-display text-xs uppercase tracking-[0.15em] transition-colors ${
        active
          ? "border-[#ffffff] bg-[#ffffff] text-black"
          : "border-[#3a3a3a] bg-[#141414] text-[#ffffff] hover:border-[#8a8a8a]"
      }`}
    >
      {children}
    </button>
  );
}

const labelClass =
  "block text-[0.6rem] font-bold uppercase tracking-[0.25em] text-[#8a8a8a]";
const inputClass =
  "mt-1.5 w-full border border-[#3a3a3a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#e5e5e5] outline-none focus:border-[#ffffff]";

const DEFAULT_VALUES: Record<string, string> = { frame: "plain" };

function FramePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (frame: Frame) => void;
}) {
  return (
    <div>
      <span className={labelClass}>Frame</span>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {FRAME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`border p-2 text-center transition-colors ${
              value === opt.value
                ? "border-[#ffffff]"
                : "border-[#3a3a3a] hover:border-[#8a8a8a]"
            }`}
          >
            <span className={`${opt.className} block h-10 w-full`} />
            <span className="mt-1.5 block text-[0.6rem] uppercase tracking-[0.15em] text-[#e5e5e5]">
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
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
  const [values, setValues] = useState<Record<string, string>>(DEFAULT_VALUES);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Pick an image first.");
      const imageUrl = await uploadMedia(file);
      await onAdd(values, imageUrl);
    },
    onSuccess: () => {
      setFile(null);
      setValues(DEFAULT_VALUES);
      setError(null);
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    },
  });

  return (
    <form
      className="max-w-md space-y-3"
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
          className={`${inputClass} file:mr-3 file:border-0 file:bg-[#ffffff] file:px-3 file:py-1 file:font-bold file:uppercase file:text-black`}
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

      <FramePicker
        value={values["frame"] ?? "plain"}
        onChange={(frame) => setValues((s) => ({ ...s, frame }))}
      />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full border border-[#ffffff] bg-[#ffffff] px-6 py-2 font-display text-sm uppercase tracking-[0.15em] text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-60"
      >
        {mutation.isPending ? "Uploading…" : "Save"}
      </button>

      {error && (
        <p className="border border-[#7a1f1f] bg-[#1a0d0d] px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#d98a8a]">
          {error}
        </p>
      )}
    </form>
  );
}

/** Elden-Ring-style inventory: a slot grid on the left, a detail panel on the right. */
function ItemInventory({
  items,
  pendingId,
  onDelete,
}: {
  items: Item[];
  pendingId: string | null;
  onDelete: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  if (items.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-xs uppercase tracking-[0.3em] text-[#6b6b6b]">
        Nothing here yet
      </p>
    );
  }

  return (
    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="grid grid-cols-4 gap-1.5 self-start sm:grid-cols-6">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={`aspect-square border bg-[#0a0a0a] p-0.5 transition-colors ${
              selectedId === item.id
                ? "border-[#ffffff]"
                : "border-[#3a3a3a] hover:border-[#8a8a8a]"
            }`}
          >
            <img
              src={item.image_url}
              alt={item.fields[0]?.value ?? ""}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      <aside className="border border-[#333333] bg-[#0a0a0a] p-4">
        {selected ? (
          <>
            <img
              src={selected.image_url}
              alt=""
              className="mb-3 aspect-square w-full border border-[#333333] object-cover"
            />
            <dl className="space-y-2">
              {selected.fields.map((f) => (
                <div key={f.label}>
                  <dt className="text-[0.55rem] uppercase tracking-[0.25em] text-[#8a8a8a]">
                    {f.label}
                  </dt>
                  <dd className="font-uploaded text-base text-[#e5e5e5]">
                    {f.value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              disabled={pendingId === selected.id}
              onClick={() => {
                onDelete(selected.id);
                setSelectedId(null);
              }}
              className="mt-4 w-full border border-[#7a1f1f] px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#d98a8a] transition-colors hover:bg-[#7a1f1f] hover:text-[#f2f2f2] disabled:opacity-50"
            >
              Delete item
            </button>
          </>
        ) : (
          <p className="py-10 text-center text-xs uppercase tracking-[0.25em] text-[#6b6b6b]">
            Select an item
          </p>
        )}
      </aside>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  count,
  children,
  actions,
}: {
  title: string;
  subtitle: string;
  count: number;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <section className="border border-[#333333] bg-[#111111]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#333333] p-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-[0.1em] text-[#ffffff]">
            {title}
          </h2>
          <p className="text-[0.6rem] uppercase tracking-[0.25em] text-[#8a8a8a]">
            {subtitle} · {count} item{count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">{actions}</div>
      </div>
      {children}
    </section>
  );
}

// --- content sections ---------------------------------------------------------

function ContentPanel({
  title,
  subtitle,
  items,
  fields,
  pendingId,
  onAdd,
  onDelete,
}: {
  title: string;
  subtitle: string;
  items: Item[];
  fields: FieldDef[];
  pendingId: string | null;
  onAdd: (values: Record<string, string>, imageUrl: string) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [view, setView] = useState<null | "items" | "add">(null);

  return (
    <Panel
      title={title}
      subtitle={subtitle}
      count={items.length}
      actions={
        <>
          <TabButton
            active={view === "items"}
            onClick={() => setView((v) => (v === "items" ? null : "items"))}
          >
            {view === "items" ? "Hide" : "View items"}
          </TabButton>
          <TabButton
            active={view === "add"}
            onClick={() => setView((v) => (v === "add" ? null : "add"))}
          >
            + Add
          </TabButton>
        </>
      }
    >
      {view === "items" && (
        <ItemInventory
          items={items}
          pendingId={pendingId}
          onDelete={onDelete}
        />
      )}
      {view === "add" && (
        <div className="p-5">
          <AddForm
            fields={fields}
            onAdd={async (v, url) => {
              await onAdd(v, url);
              setView("items");
            }}
          />
        </div>
      )}
    </Panel>
  );
}

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "text-[#ffffff]",
  contacted: "text-[#ffffff]",
  booked: "text-[#ffffff]",
  declined: "text-[#c98a8a]",
};

function BookingsPanel({
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
    <Panel
      title="Bookings"
      subtitle={`Contact-form requests${newCount > 0 ? ` · ${newCount} new` : ""}`}
      count={bookings.length}
      actions={
        <TabButton active={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "View bookings"}
        </TabButton>
      }
    >
      {open &&
        (bookings.length === 0 ? (
          <p className="px-5 py-10 text-center text-xs uppercase tracking-[0.3em] text-[#6b6b6b]">
            {isLoading ? "Loading…" : "No bookings yet"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#333333] text-left font-display text-xs uppercase tracking-[0.15em] text-[#d4d4d4]">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Placement</th>
                  <th className="px-4 py-2.5">Idea</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[#262626] align-top"
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap text-[#9a9a9a]">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-[#e5e5e5]">{b.name}</td>
                    <td className="px-4 py-2.5">
                      <a
                        href={`mailto:${b.email}`}
                        className="text-[#ffffff] underline"
                      >
                        {b.email}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-[#e5e5e5]">
                      {b.placement || "—"}
                    </td>
                    <td className="max-w-xs px-4 py-2.5 whitespace-pre-wrap text-[#e5e5e5]">
                      {b.idea || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={b.status}
                        disabled={pendingId === b.id}
                        onChange={(e) =>
                          onStatus(b.id, e.target.value as BookingStatus)
                        }
                        className={`border border-[#3a3a3a] bg-[#0a0a0a] px-2 py-1 text-xs font-bold uppercase ${STATUS_STYLE[b.status]}`}
                      >
                        {BOOKING_STATUSES.map((s) => (
                          <option key={s} value={s} className="text-[#e5e5e5]">
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        disabled={pendingId === b.id}
                        onClick={() => onDelete(b.id)}
                        className="border border-[#7a1f1f] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[#d98a8a] transition-colors hover:bg-[#7a1f1f] hover:text-[#f2f2f2] disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </Panel>
  );
}

// --- page -------------------------------------------------------------------

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
      <div className="relative mx-auto max-w-5xl px-5 py-12">
        <header className="mb-8">
          <div className="leopard-bar h-3 w-40 border border-black" />
          <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none tracking-tight text-[#ffffff]">
            Admin
          </h1>
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.3em] text-[#9a9a9a]">
            Recent work · gallery · shop · bookings
          </p>
        </header>

        <div className="space-y-5">
          <ContentPanel
            title="Recent Work"
            subtitle="Home page grid"
            items={(recentWork.data ?? []).map((r) => ({
              id: r.id,
              image_url: r.image_url,
              fields: [
                { label: "Title", value: r.title },
                { label: "Meta", value: r.meta ?? "" },
                { label: "Frame", value: r.frame },
              ],
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
                frame: (v["frame"] as Frame) ?? "plain",
              });
              await qc.invalidateQueries({ queryKey: ["recent_work"] });
            }}
            onDelete={(id) =>
              removeMutation.mutate({ table: "recent_work", id })
            }
          />

          <ContentPanel
            title="Gallery"
            subtitle="Gallery page grid"
            items={(gallery.data ?? []).map((r) => ({
              id: r.id,
              image_url: r.image_url,
              fields: [
                { label: "Title", value: r.title },
                { label: "Meta", value: r.meta ?? "" },
                { label: "Frame", value: r.frame },
              ],
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
                frame: (v["frame"] as Frame) ?? "plain",
              });
              await qc.invalidateQueries({ queryKey: ["gallery_items"] });
            }}
            onDelete={(id) =>
              removeMutation.mutate({ table: "gallery_items", id })
            }
          />

          <ContentPanel
            title="Shop"
            subtitle="Shop page products"
            items={(shop.data ?? []).map((r) => ({
              id: r.id,
              image_url: r.image_url,
              fields: [
                { label: "Name", value: r.name },
                { label: "Price", value: r.price ?? "" },
                { label: "Tag", value: r.tag ?? "" },
                { label: "Description", value: r.description ?? "" },
                { label: "Frame", value: r.frame },
              ],
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
                frame: (v["frame"] as Frame) ?? "plain",
              });
              await qc.invalidateQueries({ queryKey: ["shop_items"] });
            }}
            onDelete={(id) =>
              removeMutation.mutate({ table: "shop_items", id })
            }
          />

          <BookingsPanel
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
