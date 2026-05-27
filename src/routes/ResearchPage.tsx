import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";

export default function ResearchPage() {
  return (
    <>
      <PageHeader
        title="Research"
        subtitle="Statutes, case law and a scratchpad — not tied to any one document."
      />
      <EmptyState
        title="Research arrives in Phase 3"
        body="Indian Kanoon search + a workspace for saved searches, clipped passages and citation collections."
        cta="Configure Kanoon API (Phase 3)"
        disabled
      />
    </>
  );
}
