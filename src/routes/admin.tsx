import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/lib/use-auth";
import { emailToUsername, usernameToEmail } from "@/lib/username";
import {
  FRAME_OPTIONS,
  addGalleryItem,
  addGallerySection,
  addRecentWork,
  deleteContent,
  deleteGallerySection,
  frameClassName,
  imageCropStyle,
  listGallery,
  listGallerySections,
  listRecentWork,
  listTeam,
  renameGallerySection,
  saveGallerySectionOrder,
  setGalleryItemSection,
  setUserRole,
  uploadMedia,
  type Frame,
  type GallerySection,
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
  /** Gallery items only: the section it's filed under (null = none). */
  section_id?: string | null | undefined;
};

/** What the Gallery panel passes down so items can be filed into sections. */
type SectionControls = {
  sections: GallerySection[];
  onMove: (id: string, sectionId: string | null) => void;
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

function SectionSelect({
  id,
  sections,
  value,
  disabled = false,
  onChange,
}: {
  id: string;
  sections: GallerySection[];
  value: string;
  disabled?: boolean;
  onChange: (sectionId: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        Section
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">No section</option>
        {sections.map((sec) => (
          <option key={sec.id} value={sec.id}>
            {sec.name}
          </option>
        ))}
      </select>
    </div>
  );
}

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
  sections,
  onAdd,
}: {
  fields: FieldDef[];
  previewRatio: string;
  sections?: GallerySection[] | undefined;
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

      {sections && (
        <SectionSelect
          id="admin-section"
          sections={sections}
          value={values["section_id"] ?? ""}
          onChange={(section_id) => setValues((s) => ({ ...s, section_id }))}
        />
      )}

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
  sectionControls,
}: {
  items: Item[];
  pendingId: string | null;
  onDelete: (id: string) => void;
  sectionControls?: SectionControls | undefined;
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
            {sectionControls && (
              <div className="mt-3">
                <SectionSelect
                  id="admin-move-section"
                  sections={sectionControls.sections}
                  value={selected.section_id ?? ""}
                  disabled={pendingId === selected.id}
                  onChange={(sectionId) =>
                    sectionControls.onMove(selected.id, sectionId || null)
                  }
                />
              </div>
            )}
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
  sectionControls,
}: {
  title: string;
  subtitle: string;
  items: Item[];
  fields: FieldDef[];
  previewRatio: string;
  pendingId: string | null;
  onAdd: (values: Record<string, string>, imageUrl: string) => Promise<void>;
  onDelete: (id: string) => void;
  sectionControls?: SectionControls | undefined;
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
          sectionControls={sectionControls}
        />
      )}
      {view === "add" && (
        <div className="p-5">
          <AddForm
            fields={fields}
            previewRatio={previewRatio}
            sections={sectionControls?.sections}
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

/** Create, rename, reorder and delete the Gallery page's sections. */
function SectionsPanel({
  sections,
  counts,
}: {
  sections: GallerySection[];
  counts: Record<string, number>;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  // Unsaved edits to section names, by section id.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (run: () => Promise<void>) => run(),
    onSuccess: () => setError(null),
    onError: (e: unknown) =>
      setError(e instanceof Error ? e.message : "Something went wrong."),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["gallery_sections"] });
      void qc.invalidateQueries({ queryKey: ["gallery_items"] });
    },
  });
  const busy = mutation.isPending;

  const move = (index: number, by: -1 | 1) => {
    const ids = sections.map((sec) => sec.id);
    const [id] = ids.splice(index, 1);
    if (!id) return;
    ids.splice(index + by, 0, id);
    mutation.mutate(() => saveGallerySectionOrder(ids));
  };

  const arrowClass =
    "px-1.5 text-xs leading-none text-[#e5e5e5] transition-colors hover:text-[#ffffff] disabled:opacity-25";
  const smallButton =
    "border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] transition-colors disabled:opacity-40";

  return (
    <Panel
      title="Gallery Sections"
      subtitle="Groups on the Gallery page"
      count={sections.length}
      actions={
        <TabButton active={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Manage sections"}
        </TabButton>
      }
    >
      {open && (
        <div className="space-y-4 p-5">
          <form
            className="flex max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = newName.trim();
              if (!name) return;
              mutation.mutate(async () => {
                await addGallerySection(name, sections.length);
                setNewName("");
              });
            }}
          >
            <input
              type="text"
              aria-label="New section name"
              placeholder="New section (e.g. Blackwork)"
              maxLength={80}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={`${inputClass} mt-0`}
            />
            <button
              type="submit"
              disabled={busy || !newName.trim()}
              className="shrink-0 border border-[#ffffff] bg-[#ffffff] px-4 py-2 font-display text-xs uppercase tracking-[0.15em] text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-60"
            >
              + Add
            </button>
          </form>

          {sections.length === 0 ? (
            <p className="py-6 text-center text-xs uppercase tracking-[0.3em] text-[#6b6b6b]">
              No sections yet. The gallery shows one grid.
            </p>
          ) : (
            <ul className="divide-y divide-[#262626] border border-[#333333]">
              {sections.map((sec, i) => {
                const draft = drafts[sec.id] ?? sec.name;
                const renamed =
                  draft.trim() !== "" && draft.trim() !== sec.name;
                const count = counts[sec.id] ?? 0;
                return (
                  <li
                    key={sec.id}
                    className="flex flex-wrap items-center gap-2 bg-[#0a0a0a] px-3 py-2"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        aria-label={`Move ${sec.name} up`}
                        disabled={busy || i === 0}
                        onClick={() => move(i, -1)}
                        className={arrowClass}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${sec.name} down`}
                        disabled={busy || i === sections.length - 1}
                        onClick={() => move(i, 1)}
                        className={arrowClass}
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      type="text"
                      aria-label={`Name of ${sec.name}`}
                      maxLength={80}
                      value={draft}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [sec.id]: e.target.value }))
                      }
                      className={`${inputClass} mt-0 min-w-0 flex-1 basis-40`}
                    />
                    <span className="w-16 text-center text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8a8a]">
                      {count} item{count === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      disabled={busy || !renamed}
                      onClick={() =>
                        mutation.mutate(async () => {
                          await renameGallerySection(sec.id, draft);
                          setDrafts(({ [sec.id]: _, ...rest }) => rest);
                        })
                      }
                      className={`${smallButton} border-[#3a3a3a] text-[#ffffff] hover:border-[#8a8a8a]`}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        const note =
                          count > 0
                            ? ` Its ${count} tattoo${count === 1 ? "" : "s"} stay in the gallery, just without a section.`
                            : "";
                        if (
                          window.confirm(
                            `Delete the "${sec.name}" section?${note}`,
                          )
                        ) {
                          mutation.mutate(() => deleteGallerySection(sec.id));
                        }
                      }}
                      className={`${smallButton} border-[#7a1f1f] text-[#d98a8a] hover:bg-[#7a1f1f] hover:text-[#f2f2f2]`}
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {error && (
            <p className="border border-[#7a1f1f] bg-[#1a0d0d] px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#d98a8a]">
              {error}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}

const ROLE_STYLE: Record<string, string> = {
  master: "text-[#ffd479] border-[#ffd479]",
  admin: "text-[#ffffff] border-[#ffffff]",
  user: "text-[#8a8a8a] border-[#3a3a3a]",
};

/** Master-admin-only: grant / revoke admin on other accounts by username. */
function TeamPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const team = useQuery({ queryKey: ["team"], queryFn: listTeam });
  const rows = team.data ?? [];
  const adminCount = rows.filter(
    (m) => m.role === "admin" || m.role === "master",
  ).length;

  const mutate = useMutation({
    mutationFn: ({ email, role }: { email: string; role: "user" | "admin" }) =>
      setUserRole(email, role),
    onMutate: () => setErr(null),
    onError: (e: unknown) =>
      setErr(e instanceof Error ? e.message : "Could not change role."),
    onSuccess: () => setUsername(""),
    onSettled: () => void qc.invalidateQueries({ queryKey: ["team"] }),
  });

  return (
    <Panel
      title="Team access"
      subtitle={`${adminCount} with admin · master only`}
      count={rows.length}
      actions={
        <TabButton active={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Manage"}
        </TabButton>
      }
    >
      {open && (
        <div className="space-y-5 p-5">
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = username.trim();
              if (v)
                mutate.mutate({ email: usernameToEmail(v), role: "admin" });
            }}
          >
            <label className="flex-1 text-[0.55rem] uppercase tracking-[0.25em] text-[#8a8a8a]">
              Grant admin by username
              <input
                type="text"
                required
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="their username"
                className="mt-1 w-full border border-[#3a3a3a] bg-[#0a0a0a] px-2 py-1.5 text-xs text-[#e5e5e5] outline-none focus:border-[#ffffff]"
              />
            </label>
            <button
              type="submit"
              disabled={mutate.isPending || !username.trim()}
              className="border border-[#ffffff] bg-[#ffffff] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-black transition-colors hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              {mutate.isPending ? "…" : "Grant"}
            </button>
          </form>

          {err && (
            <p className="border border-[#7a1f1f] bg-[#1a0d0d] px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#d98a8a]">
              {err}
            </p>
          )}

          <div className="space-y-1.5">
            {team.isLoading ? (
              <p className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
                Loading…
              </p>
            ) : rows.length === 0 ? (
              <p className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">
                No accounts
              </p>
            ) : (
              rows.map((m) => (
                <div
                  key={m.email}
                  className="flex flex-wrap items-center justify-between gap-2 border border-[#333333] bg-[#0a0a0a] px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="break-all text-[#e5e5e5]">
                      {emailToUsername(m.email)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`border px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.15em] ${
                        ROLE_STYLE[m.role] ?? ROLE_STYLE["user"]
                      }`}
                    >
                      {m.role}
                    </span>
                    {m.role === "master" ? (
                      <span className="text-[0.55rem] uppercase tracking-[0.15em] text-[#6b6b6b]">
                        SQL only
                      </span>
                    ) : m.role === "admin" ? (
                      <button
                        type="button"
                        disabled={mutate.isPending}
                        onClick={() =>
                          mutate.mutate({ email: m.email, role: "user" })
                        }
                        className="border border-[#7a1f1f] px-2 py-1 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-[#d98a8a] transition-colors hover:bg-[#7a1f1f] hover:text-[#f2f2f2] disabled:opacity-50"
                      >
                        Remove admin
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={mutate.isPending}
                        onClick={() =>
                          mutate.mutate({ email: m.email, role: "admin" })
                        }
                        className="border border-[#3a3a3a] px-2 py-1 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-[#e5e5e5] transition-colors hover:border-[#ffffff] disabled:opacity-50"
                      >
                        Make admin
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

// --- page -------------------------------------------------------------------

function Admin() {
  const { isMaster } = useAuth();
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
  const sections = useQuery({
    queryKey: ["gallery_sections"],
    queryFn: listGallerySections,
  });

  const removeMutation = useMutation({
    mutationFn: ({
      table,
      id,
    }: {
      table: "recent_work" | "gallery_items";
      id: string;
    }) => deleteContent(table, id),
    onMutate: ({ id }) => setPendingId(id),
    onSettled: (_d, _e, { table }) => {
      setPendingId(null);
      void qc.invalidateQueries({ queryKey: [table] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, sectionId }: { id: string; sectionId: string | null }) =>
      setGalleryItemSection(id, sectionId),
    onMutate: ({ id }) => setPendingId(id),
    onSettled: () => {
      setPendingId(null);
      void qc.invalidateQueries({ queryKey: ["gallery_items"] });
    },
  });

  const sectionList = sections.data ?? [];
  const sectionName = (id: string | null) =>
    sectionList.find((sec) => sec.id === id)?.name ?? "No section";
  const sectionCounts: Record<string, number> = {};
  for (const item of gallery.data ?? []) {
    if (item.section_id) {
      sectionCounts[item.section_id] =
        (sectionCounts[item.section_id] ?? 0) + 1;
    }
  }

  return (
    <main className="admin-skin min-h-screen">
      <div className="relative mx-auto max-w-5xl px-5 py-12">
        <header className="mb-8">
          <div className="leopard-bar h-3 w-40 border border-black" />
          <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none tracking-tight text-[#ffffff]">
            Admin
          </h1>
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.3em] text-[#9a9a9a]">
            Home uploads · gallery uploads · gallery sections
          </p>
        </header>

        <div className="space-y-5">
          <ContentPanel
            title="Home Uploads"
            subtitle="Recent Work grid on the home page"
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
            title="Gallery Uploads"
            subtitle="Gallery page"
            items={(gallery.data ?? []).map((r) => ({
              id: r.id,
              image_url: r.image_url,
              section_id: r.section_id,
              fields: [
                { label: "Title", value: r.title },
                { label: "Meta", value: r.meta ?? "" },
                { label: "Section", value: sectionName(r.section_id) },
                { label: "Frame", value: r.frame },
              ],
            }))}
            sectionControls={{
              sections: sectionList,
              onMove: (id, sectionId) => moveMutation.mutate({ id, sectionId }),
            }}
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
                section_id: v["section_id"] || null,
                ...cropFrom(v),
              });
              await qc.invalidateQueries({ queryKey: ["gallery_items"] });
            }}
            onDelete={(id) =>
              removeMutation.mutate({ table: "gallery_items", id })
            }
          />

          <SectionsPanel sections={sectionList} counts={sectionCounts} />

          {isMaster && <TeamPanel />}
        </div>
      </div>
    </main>
  );
}
