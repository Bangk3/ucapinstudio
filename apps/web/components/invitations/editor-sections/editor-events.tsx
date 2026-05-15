"use client";

import type { EventInfo, InvitationContent } from "@invyte/templates";
import { useState } from "react";

interface Props {
  content: InvitationContent;
  onChange: (patch: Partial<InvitationContent>) => void;
}

function EventCard({
  event,
  onUpdate,
  onRemove,
}: {
  event: EventInfo;
  onUpdate: (patch: Partial<EventInfo>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-card">
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span className="flex-1 text-sm font-medium truncate">{event.name || "Acara baru"}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-muted-foreground hover:text-destructive text-xs px-1"
        >
          ✕
        </button>
        <span className="text-muted-foreground text-xs">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="border-t px-3 py-3 space-y-3">
          {[
            { key: "name", label: "Nama Acara", placeholder: "Akad Nikah / Resepsi" },
            { key: "date", label: "Tanggal", type: "date" },
            { key: "time", label: "Waktu", placeholder: "09:00" },
            { key: "venueName", label: "Nama Tempat", placeholder: "Gedung Serbaguna" },
            { key: "venueAddress", label: "Alamat", placeholder: "Jl. ..." },
            { key: "dressCode", label: "Dress Code", placeholder: "Formal / Batik" },
            { key: "mapsUrl", label: "Link Maps", placeholder: "https://maps.google.com/..." },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key} className="space-y-1">
              <label
                htmlFor={`event-field-${key}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {label}
              </label>
              <input
                id={`event-field-${key}`}
                type={type ?? "text"}
                value={(event as unknown as Record<string, string>)[key] ?? ""}
                onChange={(e) => onUpdate({ [key]: e.target.value } as Partial<EventInfo>)}
                placeholder={placeholder}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorEvents({ content, onChange }: Props) {
  const events = content.events ?? [];

  function addEvent() {
    const newEvent: EventInfo = {
      id: `evt-${Date.now()}`,
      name: "",
    };
    onChange({ events: [...events, newEvent] });
  }

  function updateEvent(idx: number, patch: Partial<EventInfo>) {
    const next = events.map((e, i) => (i === idx ? { ...e, ...patch } : e));
    onChange({ events: next });
  }

  function removeEvent(idx: number) {
    onChange({ events: events.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-3">
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Belum ada acara. Tambahkan di bawah.
        </p>
      )}
      {events.map((event, idx) => (
        <EventCard
          key={event.id}
          event={event}
          onUpdate={(patch) => updateEvent(idx, patch)}
          onRemove={() => removeEvent(idx)}
        />
      ))}
      <button
        type="button"
        onClick={addEvent}
        className="w-full rounded-lg border border-dashed py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
      >
        + Tambah Acara
      </button>
    </div>
  );
}
