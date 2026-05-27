import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";

export default function TranslatePage() {
  return (
    <>
      <PageHeader
        title="Translate"
        subtitle="Move between English and Indian languages — for documents, judgments and notices."
      />
      <EmptyState
        title="Coming soon"
        body="Translation isn't ready yet. It'll live alongside document creation so the advocate can produce or read the same matter in multiple languages without leaving Pattang."
        cta="Coming soon"
        disabled
      />
    </>
  );
}
