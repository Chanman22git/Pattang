import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";

export default function CasesPage() {
  return (
    <>
      <PageHeader
        title="Cases"
        subtitle="Every document, fact and deadline for a matter — in one place."
      />
      <EmptyState
        title="No cases yet"
        body="Once we wire up Supabase and auth, this is where your active matters will live. For now it's an empty shell — the data model is defined under supabase/migrations/."
        cta="Create a case (coming in Phase 1)"
        disabled
      />
    </>
  );
}
