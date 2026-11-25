import { parseMarkdown } from '../../lib/miniMarkdown.js';
import { formatMath } from '../../lib/assistantVisuals.js';

/**
 * Teks balasan Asisten Belajar: paragraf, daftar, tabel, dan diagram teks (```).
 * Notasi dirapikan `formatMath` (10^-3 → 10⁻³). Dirender sebagai elemen React biasa (tanpa innerHTML).
 */
export default function AssistantText({ text }) {
  const blocks = parseMarkdown(text);
  return (
    <div className="assist-md">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'pre':
            return (
              <pre key={i} className="assist-md__pre">
                {formatMath(b.text)}
              </pre>
            );
          case 'table':
            return (
              <div key={i} className="av-scroll">
                <table className="av-table assist-md__table">
                  {b.header && (
                    <thead>
                      <tr>
                        {b.header.map((c, j) => (
                          <th key={j} scope="col">
                            {formatMath(c)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k}>{formatMath(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul';
            return (
              <Tag key={i} className="assist-md__list">
                {b.items.map((it, j) => (
                  <li key={j}>{formatMath(it)}</li>
                ))}
              </Tag>
            );
          }
          default:
            return (
              <p key={i} className="assist-md__p">
                {b.lines.map((l, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {formatMath(l)}
                  </span>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
