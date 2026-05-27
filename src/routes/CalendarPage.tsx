import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Hearings and deadlines, linked back to their cases."
      />
      <EmptyState
        title="Coming soon"
        body="Calendar arrives in Phase 4: manual import first (paste/upload a cause-list), then auto-sync via a third-party eCourts API once a vendor is vetted."
        cta="Coming soon"
        disabled
      />
    </>
  );
}
