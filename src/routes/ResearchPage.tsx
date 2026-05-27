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
        title="Coming soon"
        body="Research arrives in Phase 3: Indian Kanoon search inside the portal, plus a workspace for saved searches, clipped passages and citation collections."
        cta="Coming soon"
        disabled
      />
    </>
  );
}
