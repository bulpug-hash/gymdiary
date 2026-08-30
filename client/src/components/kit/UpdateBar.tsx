// Proužek pod horní lištou. Dvě pasivní hlášky: čeká nová verze,
// nebo je appka připravená běžet offline.
import { usePwa, applyUpdate, dismissOfflineNotice } from '@/lib/pwa';

export default function UpdateBar() {
  const { updateReady, offlineReady } = usePwa();
  if (!updateReady && !offlineReady) return null;

  return (
    <div className="gd-updatebar" role="status" aria-live="polite">
      {updateReady ? (
        <>
          <span className="gd-tag gd-updatebar__lbl">Je hotová nová verze</span>
          <button className="gd-updatebar__btn" onClick={applyUpdate}>Načíst</button>
        </>
      ) : (
        <>
          <span className="gd-tag gd-updatebar__lbl">Appka je připravená i bez signálu</span>
          <button className="gd-updatebar__btn" onClick={dismissOfflineNotice}>Zavřít</button>
        </>
      )}
    </div>
  );
}
