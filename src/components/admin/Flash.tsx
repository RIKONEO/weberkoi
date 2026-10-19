/** Komunikat po zapisie albo błędzie walidacji, przekazany w adresie strony. */
export function Flash({ saved, error }: { saved?: string; error?: string }) {
  if (error) return <p className="notice notice--error" role="alert">{error}</p>;
  if (saved) return <p className="notice" role="status">Zapisano.</p>;
  return null;
}
