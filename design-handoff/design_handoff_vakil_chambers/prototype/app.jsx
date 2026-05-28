// App — Chamber direction across all surfaces.

const ARTBOARD_W = 1320;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#B8862F"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    window.chamberTokens.accent = t.accent;
    // soft is derived — keep a subtle tint of accent
    // (we leave accentSoft from tokens; the picker swatches stay restrained)
  }, [t.accent]);

  return (
    <>
      <DesignCanvas>
        <DCSection id="cases-list" title="Cases — list view" subtitle="Every matter on the file, sorted by next hearing. Pinned matter at top. Row → case dossier.">
          <DCArtboard id="cases" label="Cases list" width={ARTBOARD_W} height={1500}>
            <ChamberCasesList />
          </DCArtboard>
        </DCSection>

        <DCSection id="case-detail" title="Case Detail" subtitle="Case History (auto-extracted, confirmed) + Case Documents + Dossier sidebar.">
          <DCArtboard id="case" label="Case dossier" width={ARTBOARD_W} height={2120}>
            <ChamberCaseDetail />
          </DCArtboard>
        </DCSection>

        <DCSection id="template-detail" title="Template Detail" subtitle="Three field categories (basic / prefill / case-specific), references and a navigable index of linked documents.">
          <DCArtboard id="template" label="Template detail" width={ARTBOARD_W} height={2200}>
            <ChamberTemplateDetail />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Accent (Ashoka brass by default)">
          <TweakColor
            label="Accent color"
            value={t.accent}
            onChange={(v) => setTweak('accent', v)}
            options={['#B8862F', '#1A1F2E', '#4A1818', '#2D4A3E', '#8B6F47']}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
