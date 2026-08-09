import { ModerationSettingsForm } from "@/components/admin/moderation-settings-form";
import { getServerSession } from "@/lib/session";
import { getModerationSettings } from "@/lib/settings";

export default async function AdminModerationPage() {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;

  const { spamThreshold, bannedWords } = await getModerationSettings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Moderasi</h1>
      <ModerationSettingsForm
        initialSpamThreshold={spamThreshold}
        initialBannedWords={bannedWords}
        canEdit={role === "superadmin"}
      />
    </div>
  );
}
