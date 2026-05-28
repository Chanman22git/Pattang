type Props = {
  title: string;
  subtitle?: string;
};

/**
 * Section-specific headers own their own layout in the redesigned VC
 * screens (Cases, Case detail, Template detail). This shared header
 * survives for the not-yet-redesigned routes — Research, Calendar,
 * Translate, Templates list, New Document — so they still look like
 * part of the same app inside the new shell.
 */
export default function PageHeader({ title, subtitle }: Props) {
  return (
    <header
      style={{
        marginBottom: 28,
        paddingBottom: 18,
        borderBottom: "0.5px solid rgba(90,58,31,0.18)",
      }}
    >
      <h1
        className="font-serif font-medium text-ink m-0"
        style={{ fontSize: 32, lineHeight: 1.3, letterSpacing: "-0.005em" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="text-ink-2"
          style={{
            fontSize: 15,
            marginTop: 10,
            maxWidth: 620,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
