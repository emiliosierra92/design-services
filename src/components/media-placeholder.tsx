export function MediaPlaceholder({ label, kind = 'portrait' }: { label: string; kind?: 'portrait' | 'artwork' | 'broadcast' }) {
  return <div className={`media-placeholder ${kind}`} role="img" aria-label={`Development placeholder: ${label}`}><div className="placeholder-composition" aria-hidden="true"><i /><i /><i /></div><span className="media-corner">ES / {kind === 'portrait' ? 'STUDIO' : 'ARCHIVE'}</span><div className="media-caption"><span className="signal-dot" />{label}<small>MEDIA PLACEHOLDER</small></div></div>;
}
