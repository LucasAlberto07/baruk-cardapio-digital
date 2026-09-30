type Props = { page: number; pageCount: number; onChange: (page: number) => void };

export function Pagination({ page, pageCount, onChange }: Props) {
  if (pageCount <= 1) return null;

  return (
    <nav className="pagination" aria-label="Páginas">
      <button className="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
      <span className="muted">Página {page} de {pageCount}</span>
      <button className="secondary" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Próxima</button>
    </nav>
  );
}
