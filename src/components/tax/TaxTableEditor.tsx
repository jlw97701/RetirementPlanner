import { TableConfig } from 'lucide-react';
import type { TaxBracket } from '../../models/TaxTypes';

export function TaxTableEditor({
  title,
  brackets,
  onChange
}: {
  title: string;
  brackets: TaxBracket[];
  onChange: (b: TaxBracket[]) => void;
}) {
  const u = (id: string, c: Partial<TaxBracket>) => onChange(brackets.map((b) => (b.id === id ? { ...b, ...c } : b)));

  return (
    <section className="panel">
      <h2>
        <TableConfig />
        {title}
      </h2>
      <table>
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          {brackets.map((b) => (
            <tr key={b.id}>
              <td>
                <input
                  type="number"
                  value={b.lowerBound}
                  onChange={(e) => u(b.id, { lowerBound: Number(e.target.value) })}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={b.upperBound ?? ''}
                  placeholder="No limit"
                  onChange={(e) =>
                    u(b.id, {
                      upperBound: e.target.value === '' ? null : Number(e.target.value)
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  step=".001"
                  value={b.rate}
                  onChange={(e) => u(b.id, { rate: Number(e.target.value) })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
