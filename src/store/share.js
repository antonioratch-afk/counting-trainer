// Share Sheet, clipboard and file picking, with fallbacks for older iOS versions.

/** @returns {Promise<'shared'|'cancelled'|'unsupported'>} Must be called directly from a tap. */
export async function shareFile(name, text) {
  let file;
  try { file = new File([text], name, { type: 'application/json' }); } catch { return 'unsupported'; }
  if (!navigator.canShare || !navigator.canShare({ files: [file] })) return 'unsupported';
  try {
    await navigator.share({ files: [file], title: name });
    return 'shared';
  } catch (err) {
    if (err?.name === 'AbortError') return 'cancelled';
    return 'unsupported';
  }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

/** Resolves with the file text, or null if no file was chosen. iOS sends no cancel event, so the
 * screen offers its own Cancel button that calls the returned cancel(). */
export function pickFile() {
  const input = document.createElement('input');
  input.type = 'file';
  let finish;
  const promise = new Promise((resolve) => { finish = resolve; });
  input.addEventListener('change', async () => {
    const f = input.files?.[0];
    finish(f ? await f.text() : null);
  });
  input.click();
  return { promise, cancel: () => finish(null) };
}
