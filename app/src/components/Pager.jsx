export default function Pager({ total, page, setPage, perPage = 10 }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div className="pager">
      <button className="pager__btn pager__btn--nav" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button key={p} className={`pager__btn${p === page ? ' is-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
      ))}
      <button className="pager__btn pager__btn--nav" disabled={page === pages} onClick={() => setPage(page + 1)}>›</button>
    </div>
  );
}
