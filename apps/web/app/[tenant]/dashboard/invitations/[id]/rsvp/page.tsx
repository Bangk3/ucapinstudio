import { getInvitation } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import { getTenantBySlug } from "@/lib/tenant";
import { events, db, rsvps } from "@invyte/db";
import { and, asc, eq } from "drizzle-orm";
import { Download, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ tenant: string; id: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  yes: "Hadir",
  no: "Tidak Hadir",
  maybe: "Mungkin",
};

const STATUS_COLORS: Record<string, string> = {
  yes: "bg-green-100 text-green-700",
  no: "bg-red-100 text-red-600",
  maybe: "bg-yellow-100 text-yellow-700",
};

export default async function RsvpPage({ params }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");

  const { tenant, id } = await params;
  const tenantRecord = await getTenantBySlug(tenant);
  if (!tenantRecord) redirect("/");

  const invitation = await getInvitation(tenantRecord.id, id);
  if (!invitation) notFound();

  // Fetch events + RSVPs in parallel
  const [eventList, rsvpList] = await Promise.all([
    db
      .select()
      .from(events)
      .where(and(eq(events.invitationId, id), eq(events.tenantId, tenantRecord.id)))
      .orderBy(asc(events.sortOrder)),
    db
      .select()
      .from(rsvps)
      .where(and(eq(rsvps.invitationId, id), eq(rsvps.tenantId, tenantRecord.id)))
      .orderBy(asc(rsvps.createdAt)),
  ]);

  // Aggregate counts
  const totalYes = rsvpList.filter((r) => r.status === "yes").length;
  const totalNo = rsvpList.filter((r) => r.status === "no").length;
  const totalMaybe = rsvpList.filter((r) => r.status === "maybe").length;
  const totalPlusOne = rsvpList.reduce((acc, r) => acc + r.plusOneCount, 0);
  const totalAttending = totalYes + totalPlusOne;

  // Per-event breakdown
  const perEvent = eventList.map((ev) => {
    const evRsvps = rsvpList.filter((r) => r.eventId === ev.id);
    return {
      event: ev,
      yes: evRsvps.filter((r) => r.status === "yes").length,
      no: evRsvps.filter((r) => r.status === "no").length,
      maybe: evRsvps.filter((r) => r.status === "maybe").length,
      plusOne: evRsvps.reduce((a, r) => a + r.plusOneCount, 0),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${tenant}/dashboard/invitations/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {invitation.name}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Konfirmasi Kehadiran</h1>
            <p className="text-sm text-muted-foreground mt-1">{rsvpList.length} total respons</p>
          </div>
          <a
            href={`/api/v1/invitations/${id}/rsvps/export?tenantSlug=${tenant}`}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Hadir",
            value: totalYes,
            sub: `+${totalPlusOne} tamu tambahan`,
            color: "text-green-700",
          },
          { label: "Tidak Hadir", value: totalNo, sub: null, color: "text-red-600" },
          { label: "Mungkin", value: totalMaybe, sub: null, color: "text-yellow-600" },
          {
            label: "Total Hadir",
            value: totalAttending,
            sub: "termasuk plus-one",
            color: "text-primary",
          },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border bg-card px-4 py-3 space-y-1">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Per-event breakdown */}
      {perEvent.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Per Acara</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Acara</th>
                  <th className="px-4 py-2.5 text-center font-medium text-green-700">Hadir</th>
                  <th className="px-4 py-2.5 text-center font-medium text-red-600">Tidak</th>
                  <th className="px-4 py-2.5 text-center font-medium text-yellow-600">Mungkin</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">
                    +Tamu
                  </th>
                </tr>
              </thead>
              <tbody>
                {perEvent.map(({ event: ev, yes, no, maybe, plusOne }) => (
                  <tr
                    key={ev.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{ev.name}</p>
                      {ev.date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(ev.date).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-green-700">{yes}</td>
                    <td className="px-4 py-3 text-center font-semibold text-red-600">{no}</td>
                    <td className="px-4 py-3 text-center font-semibold text-yellow-600">{maybe}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">+{plusOne}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full RSVP list */}
      {rsvpList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 gap-3">
          <Users className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Belum ada respons RSVP</p>
          <p className="text-sm text-muted-foreground">
            Respons akan muncul setelah tamu mengisi form konfirmasi kehadiran.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Semua Respons</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nama</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Acara</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">
                    +Tamu
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">
                    Catatan Diet
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Waktu
                  </th>
                </tr>
              </thead>
              <tbody>
                {rsvpList.map((rsvp) => {
                  const ev = eventList.find((e) => e.id === rsvp.eventId);
                  return (
                    <tr
                      key={rsvp.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{rsvp.guestName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{ev?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[rsvp.status] ?? ""}`}
                        >
                          {STATUS_LABELS[rsvp.status] ?? rsvp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {rsvp.plusOneCount > 0 ? `+${rsvp.plusOneCount}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell max-w-[180px] truncate">
                        {rsvp.dietaryNotes ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                        {new Date(rsvp.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
