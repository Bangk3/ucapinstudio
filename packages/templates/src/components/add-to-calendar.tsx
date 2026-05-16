"use client";

interface AddToCalendarProps {
  eventName: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  venueName?: string;
  venueAddress?: string;
  primaryColor?: string;
}

function formatDate(date: string, time?: string): string {
  // Returns YYYYMMDDTHHMMSS for .ics
  const d = date.replace(/-/g, "");
  const t = time ? `${time.replace(":", "")}00` : "000000";
  return `${d}T${t}`;
}

function makeIcs(props: AddToCalendarProps): string {
  const start = formatDate(props.date, props.time);
  // Default duration: 2 hours
  const end = (() => {
    const dt = new Date(`${props.date}T${props.time ?? "00:00"}:00`);
    dt.setHours(dt.getHours() + 2);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
  })();
  const location = [props.venueName, props.venueAddress].filter(Boolean).join(", ");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//invyte//NONSGML v1.0//EN",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${props.eventName}`,
    location ? `LOCATION:${location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function makeGoogleUrl(props: AddToCalendarProps): string {
  const start = formatDate(props.date, props.time);
  const dt = new Date(`${props.date}T${props.time ?? "00:00"}:00`);
  dt.setHours(dt.getHours() + 2);
  const pad = (n: number) => String(n).padStart(2, "0");
  const end = `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
  const location = [props.venueName, props.venueAddress].filter(Boolean).join(", ");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: props.eventName,
    dates: `${start}/${end}`,
    ...(location ? { location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function AddToCalendar({
  eventName,
  date,
  time,
  venueName,
  venueAddress,
  primaryColor = "#6b8f6e",
}: AddToCalendarProps) {
  const downloadIcs = () => {
    const ics = makeIcs({
      eventName,
      date,
      ...(time !== undefined ? { time } : {}),
      ...(venueName !== undefined ? { venueName } : {}),
      ...(venueAddress !== undefined ? { venueAddress } : {}),
    });
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName.replace(/\s+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openGoogle = () => {
    window.open(
      makeGoogleUrl({
        eventName,
        date,
        ...(time !== undefined ? { time } : {}),
        ...(venueName !== undefined ? { venueName } : {}),
        ...(venueAddress !== undefined ? { venueAddress } : {}),
      }),
      "_blank",
      "noopener",
    );
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-3">
      <button
        type="button"
        onClick={openGoogle}
        className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50"
        style={{ borderColor: primaryColor, color: primaryColor }}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
        </svg>
        Google Calendar
      </button>
      <button
        type="button"
        onClick={downloadIcs}
        className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50"
        style={{ borderColor: primaryColor, color: primaryColor }}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        Apple / Outlook
      </button>
    </div>
  );
}
