type Props = {
  title: string;
  body: string;
  cta?: string;
  disabled?: boolean;
  onClick?: () => void;
};

/**
 * Vakil Chambers empty state: foolscap-cream card, dashed Teak border,
 * Spectral title.
 */
export default function EmptyState({
  title,
  body,
  cta,
  disabled,
  onClick,
}: Props) {
  return (
    <div
      className="text-center"
      style={{
        background: "#FAF8F3",
        border: "0.5px dashed rgba(90,58,31,0.4)",
        borderRadius: 2,
        padding: "56px 24px",
      }}
    >
      <div
        className="font-serif font-medium text-ink"
        style={{ fontSize: 22, lineHeight: 1.3, marginBottom: 8 }}
      >
        {title}
      </div>
      <p
        className="text-ink-2"
        style={{
          fontSize: 14,
          maxWidth: 480,
          margin: "0 auto",
          lineHeight: 1.6,
        }}
      >
        {body}
      </p>
      {cta && (
        <button
          disabled={disabled}
          onClick={onClick}
          className={disabled ? "vc-btn-secondary" : "vc-btn-primary"}
          style={{ marginTop: 24 }}
        >
          {cta}
        </button>
      )}
    </div>
  );
}
