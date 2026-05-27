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
        title="Calendar arrives in Phase 4"
        body="Manual import first (cause-list paste / upload). Auto-sync via a third-party eCourts API is the second step, once a vendor is vetted."
        cta="Set up calendar (Phase 4)"
        disabled
      />
    </>
  );
}
