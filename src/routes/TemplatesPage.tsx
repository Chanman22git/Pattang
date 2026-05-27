import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";

export default function TemplatesPage() {
  return (
    <>
      <PageHeader
        title="Templates"
        subtitle="Reusable document types — petitions, appeals, legal notices. Structure stays fixed; content varies by case."
      />
      <EmptyState
        title="No templates yet"
        body="Phase 1 will introduce template creation from 1–2 sample documents, with fields auto-categorised into basic / prefill / case-specific."
        cta="Add a template (Phase 1)"
        disabled
      />
    </>
  );
}
