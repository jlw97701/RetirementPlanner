import { useState } from 'react';
import { Calculator, ArrowLeft, TableConfig } from 'lucide-react';
import { PlannerInputsPanel } from './components/inputs/PlannerInputsPanel';
import { ScenarioCards } from './components/scenarios/ScenarioCards';
import { ScenarioChart } from './components/dashboard/ScenarioChart';
import { ScenarioSummaryTable } from './components/dashboard/ScenarioSummaryTable';
import { YearDetailsTable } from './components/dashboard/YearDetailsTable';
import { TaxTableEditor } from './components/tax/TaxTableEditor';
import { useRetirementModel } from './hooks/useRetirementModel';

export default function App() {
  const {
    inputs,
    setInputs,
    ssIncome,
    setSSIncome,
    colaSettings,
    setColaSettings,
    assetAllocation,
    setAssetAllocation,
    taxConfig,
    setTaxConfig,
    projections
  } = useRetirementModel();

  const [selectedId, setSelectedId] = useState(projections[0]?.scenario.id ?? '');

  const [showTaxTables, setShowTaxTables] = useState(false);

  const selected = projections.find((p) => p.scenario.id === selectedId) ?? projections[0];

  const summaries = projections.map((p) => p.summary);

  return (
    <div className="app">
      <header>
        <div>
          <h1>
            <Calculator size={28} />
            Retirement Planner
          </h1>
          <p>Social Security timing, Roth conversions, federal and state taxes, and RMD planning.</p>
        </div>
        <button className="header-button" onClick={() => setShowTaxTables((v) => !v)}>
          {showTaxTables ? <ArrowLeft /> : <TableConfig />}
          {showTaxTables ? 'Back to planner' : 'Configure tax tables'}
        </button>
      </header>
      {showTaxTables ? (
        <main className="tax-layout">
          <TaxTableEditor
            title="Federal tax brackets"
            brackets={taxConfig.federal[0].brackets}
            onChange={(brackets) =>
              setTaxConfig({
                ...taxConfig,
                federal: [{ ...taxConfig.federal[0], brackets }]
              })
            }
          />
          <TaxTableEditor
            title="State tax brackets"
            brackets={taxConfig.state[0].brackets}
            onChange={(brackets) =>
              setTaxConfig({
                ...taxConfig,
                state: [{ ...taxConfig.state[0], brackets }]
              })
            }
          />
        </main>
      ) : (
        <main className="planner-layout">
          <PlannerInputsPanel
            inputs={inputs}
            setInputs={setInputs}
            ssIncome={ssIncome}
            setSSIncome={setSSIncome}
            colaSettings={colaSettings}
            setColaSettings={setColaSettings}
            assetAllocation={assetAllocation}
            setAssetAllocation={setAssetAllocation}
          />
          <section className="content">
            {/* <ScenarioCards
              summaries={summaries}
              selectedId={selected?.scenario.id ?? ""}
              onSelect={setSelectedId}
            /> */}
            <ScenarioSummaryTable
              summaries={summaries}
              inputs={inputs}
              selectedId={selected?.scenario.id ?? ''}
              onSelect={setSelectedId}
            />
            {selected && (
              <>
                <ScenarioChart rows={selected.rows} scenario={selected.scenario} />
                <YearDetailsTable rows={selected.rows} />
              </>
            )}
            <div className="notice">
              Educational planning model only. Verify tax rules, Social Security amounts, Medicare IRMAA, and conversion
              strategy with a qualified professional.
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
