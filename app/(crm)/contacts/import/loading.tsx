export default function ContactsImportLoading() {
  return (
    <div className="space-y-4" data-testid="contacts-import-loading">
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
      <div className="h-40 animate-pulse rounded-xl bg-zinc-100" />
    </div>
  );
}
