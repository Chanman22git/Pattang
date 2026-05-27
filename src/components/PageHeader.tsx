type Props = {
  title: string;
  subtitle?: string;
};

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-8 border-b border-black/10 pb-5">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-sm text-ink-muted max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </header>
  );
}
