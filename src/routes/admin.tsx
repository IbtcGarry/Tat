import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { format, isSameDay } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/lib/use-auth";
import {
  BOOKING_STATUSES,
  FRAME_OPTIONS,
  addGalleryItem,
  addRecentWork,
  addShopItem,
  deleteBooking,
  deleteContent,
  frameClassName,
  imageCropStyle,
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
      { title: "Admin — Toosh Tattoos" },
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

const DEFAULT_VALUES: Record<string, string> = {
  frame: "plain",
  scale: "1",
  focusX: "50",
  focusY: "50",
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/** Pull the crop (zoom + focal point) out of the AddForm's string value bag. */
const cropFrom = (v: Record<string, string>) => ({
  scale: Number(v["scale"] ?? "1") || 1,
  focus_x: Number(v["focusX"] ?? "50"),
  focus_y: Number(v["focusY"] ?? "50"),
});

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
      <div className="mt-1.5 grid grid-cols-2 gap-2">
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

/**
 * Live "what it'll look like" card: the chosen frame around the picked image,
 * plus a scale slider and drag-to-reposition so the admin controls the crop.
 */
function FramedPreview({
  frame,
  src,
  ratio,
  heading,
  sub,
  scale,
  focusX,
  focusY,
  onScale,
  onFocus,
}: {
  frame: string;
  src: string | null;
  ratio: string;
  heading: string;
  sub: string;
  scale: number;
  focusX: number;
  focusY: number;
  onScale: (next: number) => void;
  onFocus: (x: number, y: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  function pointToFocus(clientX: number, clientY: number) {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onFocus(
      Math.round(clamp(((clientX - r.left) / r.width) * 100, 0, 100)),
      Math.round(clamp(((clientY - r.top) / r.height) * 100, 0, 100)),
    );
  }

  return (
    <div>
      <span className={labelClass}>Preview</span>
      <div className={`mt-1.5 overflow-hidden ${frameClassName(frame)}`}>
        <div
          ref={boxRef}
          className={`relative w-full overflow-hidden ${ratio} ${
            src ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
          }`}
          onPointerDown={(e) => {
            if (!src) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            pointToFocus(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (dragging) pointToFocus(e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            setDragging(false);
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
              /* pointer capture already released */
            }
          }}
        >
          {src ? (
            <>
              <img
                src={src}
                alt=""
                draggable={false}
                className="h-full w-full select-none object-cover"
                style={imageCropStyle({
                  scale,
                  focus_x: focusX,
                  focus_y: focusY,
                })}
              />
              <span
                className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ffffff] mix-blend-difference"
                style={{ left: `${focusX}%`, top: `${focusY}%` }}
              />
            </>
          ) : (
            <div className="grid h-full w-full place-items-center bg-[#0a0a0a] text-[0.6rem] uppercase tracking-[0.25em] text-[#6b6b6b]">
              Pick an image to preview
            </div>
          )}
        </div>
        {(heading || sub) && (
          <div className="p-4 font-uploaded">
            <span className="block text-lg text-secondary">
              {heading || "Title"}
            </span>
            {sub && (
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {sub}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <span className="text-[0.55rem] uppercase tracking-[0.25em] text-[#8a8a8a]">
          Scale
        </span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={scale}
          disabled={!src}
          onChange={(e) => onScale(Number(e.target.value))}
          className="flex-1 accent-[#ffffff] disabled:opacity-40"
        />
        <span className="w-9 text-right text-[0.6rem] tabular-nums text-[#e5e5e5]">
          {scale.toFixed(2)}×
        </span>
        <button
          type="button"
          disabled={!src}
          onClick={() => {
            onScale(1);
            onFocus(50, 50);
          }}
          className="border border-[#3a3a3a] px-2 py-1 text-[0.55rem] uppercase tracking-[0.15em] text-[#e5e5e5] transition-colors hover:border-[#8a8a8a] disabled:opacity-40"
        >
          Reset
        </button>
      </div>
      <p className="mt-1 text-[0.55rem] uppercase tracking-[0.2em] text-[#6b6b6b]">
        Drag on the image to reposition · slider to zoom
      </p>
    </div>
  );
}

function AddForm({
  fields,
  previewRatio,
  onAdd,
}: {
  fields: FieldDef[];
  previewRatio: string;
  onAdd: (values: Record<string, string>, imageUrl: string) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(DEFAULT_VALUES);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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

  const frame = values["frame"] ?? "plain";
  const scale = Number(values["scale"] ?? "1") || 1;
  const focusX = Number(values["focusX"] ?? "50");
  const focusY = Number(values["focusY"] ?? "50");

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
        value={frame}
        onChange={(next) => setValues((s) => ({ ...s, frame: next }))}
      />

      <FramedPreview
        frame={frame}
        src={previewUrl}
        ratio={previewRatio}
        heading={values[fields[0]?.name ?? ""] ?? ""}
        sub={values[fields[1]?.name ?? ""] ?? ""}
        scale={scale}
        focusX={focusX}
        focusY={focusY}
        onScale={(n) =>
          setValues((s) => ({
            ...s,
            scale: (Math.round(clamp(n, 1, 3) * 100) / 100).toString(),
          }))
        }
        onFocus={(x, y) =>
          setValues((s) => ({ ...s, focusX: String(x), focusY: String(y) }))
        }
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
  previewRatio,
  pendingId,
  onAdd,
  onDelete,
}: {
  title: string;
  subtitle: string;
  items: Item[];
  fields: FieldDef[];
  previewRatio: string;
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
            previewRatio={previewRatio}
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

function whenLabel(b: Booking): string {
  if (!b.starts_at) return "—";
  const start = new Date(b.starts_at);
  const end = b.ends_at ? new Date(b.ends_at) : null;
  return end
    ? `${format(start, "EEE d MMM · h:mm a")} – ${format(end, "h:mm a")}`
    : format(start, "EEE d MMM · h:mm a");
}

function StatusSelect({
  booking,
  pending,
  onStatus,
}: {
  booking: Booking;
  pending: boolean;
  onStatus: (id: string, status: BookingStatus) => void;
}) {
  return (
    <select
      value={booking.status}
      disabled={pending}
      onChange={(e) => onStatus(booking.id, e.target.value as BookingStatus)}
      className={`border border-[#3a3a3a] bg-[#0a0a0a] px-2 py-1 text-xs font-bold uppercase ${STATUS_STYLE[booking.status]}`}
    >
      {BOOKING_STATUSES.map((s) => (
        <option key={s} value={s} className="text-[#e5e5e5]">
          {s}
        </option>
      ))}
    </select>
  );
}

function DeleteButton({
  id,
  pending,
  onDelete,
}: {
  id: string;
  pending: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => onDelete(id)}
      className="border border-[#7a1f1f] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[#d98a8a] transition-colors hover:bg-[#7a1f1f] hover:text-[#f2f2f2] disabled:opacity-50"
    >
      Delete
    </button>
  );
}

function BookingCard({
  booking,
  pendingId,
  onStatus,
  onDelete,
}: {
  booking: Booking;
  pendingId: string | null;
  onStatus: (id: string, status: BookingStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="border border-[#333333] bg-[#0a0a0a] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-sm uppercase tracking-[0.1em] text-[#ffffff]">
          {booking.starts_at
            ? format(new Date(booking.starts_at), "h:mm a")
            : "No time set"}
        </span>
        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-[#9a9a9a]">
          {booking.name}
        </span>
      </div>
      <a
        href={`mailto:${booking.email}`}
        className="mt-1 block text-xs text-[#ffffff] underline"
      >
        {booking.email}
      </a>
      {booking.placement && (
        <p className="mt-1 text-xs text-[#e5e5e5]">{booking.placement}</p>
      )}
      {booking.idea && (
        <p className="mt-1 whitespace-pre-wrap text-xs text-[#9a9a9a]">
          {booking.idea}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusSelect
          booking={booking}
          pending={pendingId === booking.id}
          onStatus={onStatus}
        />
        <DeleteButton
          id={booking.id}
          pending={pendingId === booking.id}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

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
  const [view, setView] = useState<null | "list" | "calendar">(null);
  const [day, setDay] = useState<Date | undefined>(new Date());
  const newCount = bookings.filter((b) => b.status === "new").length;

  const scheduled = useMemo(
    () =>
      bookings
        .filter((b) => b.starts_at)
        .sort((a, b) => a.starts_at!.localeCompare(b.starts_at!)),
    [bookings],
  );
  const unscheduled = useMemo(
    () => bookings.filter((b) => !b.starts_at),
    [bookings],
  );
  const bookedDays = useMemo(
    () => scheduled.map((b) => new Date(b.starts_at!)),
    [scheduled],
  );
  const dayEvents = day
    ? scheduled.filter((b) => isSameDay(new Date(b.starts_at!), day))
    : [];
  const upcoming = scheduled.filter(
    (b) => new Date(b.ends_at ?? b.starts_at!).getTime() >= Date.now(),
  );

  return (
    <Panel
      title="Bookings"
      subtitle={`${scheduled.length} scheduled · ${unscheduled.length} unscheduled${
        newCount > 0 ? ` · ${newCount} new` : ""
      }`}
      count={bookings.length}
      actions={
        <>
          <TabButton
            active={view === "calendar"}
            onClick={() =>
              setView((v) => (v === "calendar" ? null : "calendar"))
            }
          >
            Calendar
          </TabButton>
          <TabButton
            active={view === "list"}
            onClick={() => setView((v) => (v === "list" ? null : "list"))}
          >
            List
          </TabButton>
        </>
      }
    >
      {view === "list" &&
        (bookings.length === 0 ? (
          <p className="px-5 py-10 text-center text-xs uppercase tracking-[0.3em] text-[#6b6b6b]">
            {isLoading ? "Loading…" : "No bookings yet"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#333333] text-left font-display text-xs uppercase tracking-[0.15em] text-[#d4d4d4]">
                  <th className="px-4 py-2.5">When</th>
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
                      {whenLabel(b)}
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
                      <StatusSelect
                        booking={b}
                        pending={pendingId === b.id}
                        onStatus={onStatus}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <DeleteButton
                        id={b.id}
                        pending={pendingId === b.id}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {view === "calendar" && (
        <div className="grid gap-5 p-5 lg:grid-cols-[auto_minmax(0,1fr)]">
          <div className="self-start border border-[#333333] bg-[#0a0a0a] p-2">
            <Calendar
              mode="single"
              selected={day}
              onSelect={setDay}
              modifiers={{ booked: bookedDays }}
              modifiersClassNames={{
                booked:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              }}
            />
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="font-display text-xs uppercase tracking-[0.2em] text-[#d4d4d4]">
                {day ? format(day, "EEEE d MMMM") : "Pick a day"}
              </h3>
              <div className="mt-2 space-y-2">
                {dayEvents.length === 0 ? (
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
                    Nothing booked this day
                  </p>
                ) : (
                  dayEvents.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      pendingId={pendingId}
                      onStatus={onStatus}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            </div>

            {upcoming.length > 0 && (
              <div>
                <h3 className="font-display text-xs uppercase tracking-[0.2em] text-[#d4d4d4]">
                  Next up
                </h3>
                <ul className="mt-2 space-y-1 text-xs text-[#9a9a9a]">
                  {upcoming.slice(0, 6).map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => setDay(new Date(b.starts_at!))}
                        className="text-left hover:text-[#ffffff]"
                      >
                        {format(new Date(b.starts_at!), "EEE d MMM · h:mm a")} —{" "}
                        {b.name}{" "}
                        <span className="uppercase tracking-[0.15em] text-[#6b6b6b]">
                          ({b.status})
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {unscheduled.length > 0 && (
              <div>
                <h3 className="font-display text-xs uppercase tracking-[0.2em] text-[#d4d4d4]">
                  Unscheduled requests
                </h3>
                <div className="mt-2 space-y-2">
                  {unscheduled.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      pendingId={pendingId}
                      onStatus={onStatus}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
            previewRatio="aspect-[9/8]"
            pendingId={pendingId}
            onAdd={async (v, image_url) => {
              await addRecentWork({
                title: v["title"] ?? "",
                meta: v["meta"] ?? "",
                image_url,
                frame: (v["frame"] as Frame) ?? "plain",
                ...cropFrom(v),
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
            previewRatio="aspect-[5/4]"
            pendingId={pendingId}
            onAdd={async (v, image_url) => {
              await addGalleryItem({
                title: v["title"] ?? "",
                meta: v["meta"] ?? "",
                image_url,
                frame: (v["frame"] as Frame) ?? "plain",
                ...cropFrom(v),
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
            previewRatio="aspect-[6/5]"
            pendingId={pendingId}
            onAdd={async (v, image_url) => {
              await addShopItem({
                name: v["name"] ?? "",
                price: v["price"] ?? "",
                tag: v["tag"] ?? "",
                description: v["description"] ?? "",
                image_url,
                frame: (v["frame"] as Frame) ?? "plain",
                ...cropFrom(v),
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
