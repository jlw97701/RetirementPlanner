import { TableConfig } from 'lucide-react';
import type { FederalTaxConfig, TaxBracket } from '../../models/TaxTypes';

/**
jlw - TO DO: Tax-model discrepancies

8. Tax brackets remain frozen at 2026 nominal values
Spending, benefits, and investments grow in nominal dollars, but the engine uses the same 2026 brackets and deductions through age 95. 
This increasingly overstates taxes over time.
For projected years after 2026, inflate:
Bracket lower and upper bounds.
Standard deductions.
Age-based deduction.
Do not inflate the Social Security provisional-income thresholds unless modeling a hypothetical change; 
those thresholds are not presently indexed.
A simple projected configuration could be:

function projectTaxConfig(base: FederalTaxConfig, cumulativeInflation: number): FederalTaxConfig {
  const scale = 1 + cumulativeInflation;

  return {
    ...base,
    year: projectedYear,
    brackets: base.brackets.map((bracket) => ({
      ...bracket,
      lowerBound: bracket.lowerBound * scale,
      upperBound: bracket.upperBound === null ? null : bracket.upperBound * scale
    })),
    deductions: {
      standardDeduction: base.deductions.standardDeduction * scale,
      additionalDeduction65: base.deductions.additionalDeduction65 * scale
    }
  };
}

9. The temporary senior deduction is still absent
The model contains the ordinary additional standard deduction for an unmarried taxpayer age 65 or older, but not the separate 
$6,000 enhanced senior deduction applicable for 2025–2028 and subject to its MAGI phaseout. IRS senior-deduction guidance
Represent this as a year-limited deduction rather than adding it to the permanent standard deduction.

10. Oregon tax remains an approximation
The state engine applies brackets after only a standard deduction. It does not model Oregon’s complete additions, subtractions, 
credits, or federal-tax subtraction. The displayed value should be explicitly labeled an estimate until those rules are implemented.    
*/

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
