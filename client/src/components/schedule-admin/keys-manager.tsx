import { useCallback, useEffect, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import KeyTermsFields from "@/components/schedule-admin/key-terms-fields";
import { type KeyTermsForm, describeKeyTypes, formFromDefaults, formFromKey, termsFromForm } from "@/lib/booking-config";
import { ScheduleApiError } from "@/lib/schedule-api";
import {
  type AccessKey,
  type BookingConfig,
  describeAdminError,
  issueKey,
  listKeys,
  revokeKey,
  updateKey,
} from "@/lib/schedule-admin-api";

const STATUS_LABEL: Record<AccessKey["status"], string> = { ok: "Active", expired: "Expired", used_up: "Used up" };

function errorMessage(err: unknown): string {
  return describeAdminError(err instanceof ScheduleApiError ? err.code : "server_error");
}

function formatExpiry(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(iso));
}

interface Props {
  token: string;
  config: BookingConfig;
}

export default function KeysManager({ token, config }: Props) {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [issueForm, setIssueForm] = useState<KeyTermsForm>(() => formFromDefaults(config.keyDefaults));
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<KeyTermsForm | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setKeys((await listKeys(token)).keys);
      setListError(null);
    } catch (err) {
      setListError(errorMessage(err));
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = termsFromForm(issueForm);
    if ("error" in parsed) return setIssueError(parsed.error);
    setIssuing(true);
    setIssueError(null);
    try {
      const issued = await issueKey(token, parsed.terms);
      setNewKey(issued.key);
      setCopied(false);
      setIssueForm(formFromDefaults(config.keyDefaults));
      await refresh();
    } catch (err) {
      setIssueError(errorMessage(err));
    } finally {
      setIssuing(false);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const startEdit = (key: AccessKey) => {
    setEditingId(key.id);
    setEditForm(formFromKey(key, config.timeZone));
    setRowError(null);
    setConfirmRevokeId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editForm) return;
    const parsed = termsFromForm(editForm);
    if ("error" in parsed) return setRowError(parsed.error);
    try {
      await updateKey(token, id, parsed.terms);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setRowError(errorMessage(err));
    }
  };

  const revoke = async (id: string) => {
    try {
      await revokeKey(token, id);
      setConfirmRevokeId(null);
      await refresh();
    } catch (err) {
      setRowError(errorMessage(err));
    }
  };

  return (
    <div className="grid gap-10">
      <section className="grid gap-5">
        <h3 className="text-base font-semibold">Issue a key</h3>
        <form onSubmit={handleIssue} className="grid gap-5">
          <KeyTermsFields form={issueForm} onChange={setIssueForm} types={config.types} />
          {issueError && <p role="alert" className="text-sm text-destructive">{issueError}</p>}
          <Button type="submit" disabled={issuing} className="w-fit">
            <KeyRound />
            {issuing ? "Issuing…" : "Issue key"}
          </Button>
        </form>
        {newKey && (
          <div role="status" className="grid gap-3 rounded-md bg-brand-soft p-4">
            <p className="text-sm">
              Send this key with <span className="font-medium">j2a3e.com/#schedule</span>. It is shown only once.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <code className="rounded-md bg-background px-3 py-2 font-mono text-lg tracking-wider">{newKey}</code>
              <Button type="button" variant="outline" size="sm" onClick={copyKey}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setNewKey(null)}>Done</Button>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <h3 className="text-base font-semibold">Keys</h3>
        {listError && <p role="alert" className="text-sm text-destructive">{listError}</p>}
        {keys.length === 0 && !listError && <p className="text-sm text-muted-foreground">No keys issued yet.</p>}
        <ul className="divide-y divide-border rounded-md border border-border">
          {keys.map(key => (
            <li key={key.id} className="grid gap-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid gap-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {key.label || <span className="text-muted-foreground">Unlabeled</span>}
                    <Badge variant={key.status === "ok" ? "default" : "secondary"}>{STATUS_LABEL[key.status]}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {key.uses}/{key.maxUses ?? "∞"} used · {describeKeyTypes(key.typeIds, config.types)} · expires{" "}
                    {formatExpiry(key.expiresAt, config.timeZone)} · <code className="text-xs">{key.id}</code>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => (editingId === key.id ? setEditingId(null) : startEdit(key))}>
                    {editingId === key.id ? "Cancel" : "Edit"}
                  </Button>
                  {confirmRevokeId === key.id ? (
                    <Button type="button" variant="destructive" size="sm" onClick={() => void revoke(key.id)}>
                      Confirm revoke
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmRevokeId(key.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
              {editingId === key.id && editForm && (
                <div className="grid gap-4 rounded-md bg-muted/50 p-4">
                  <KeyTermsFields form={editForm} onChange={setEditForm} types={config.types} />
                  {rowError && <p role="alert" className="text-sm text-destructive">{rowError}</p>}
                  <Button type="button" className="w-fit" onClick={() => void saveEdit(key.id)}>Save key</Button>
                </div>
              )}
              {editingId !== key.id && confirmRevokeId === key.id && rowError && (
                <p role="alert" className="text-sm text-destructive">{rowError}</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
