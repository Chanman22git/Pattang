type Props = {
  title: string;
  body: string;
  cta?: string;
  disabled?: boolean;
};

export default function EmptyState({ title, body, cta, disabled }: Props) {
  return (
    <div className="border border-dashed border-black/15 rounded-lg p-10 text-center bg-white/50">
      <div className="font-serif text-xl font-semibold mb-2">{title}</div>
      <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
        {body}
      </p>
      {cta && (
        <button
          disabled={disabled}
          className="mt-6 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-accent text-white disabled:bg-black/10 disabled:text-ink-muted disabled:cursor-not-allowed"
        >
          {cta}
        </button>
      )}
    </div>
  );
}
