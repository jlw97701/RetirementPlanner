import { useEffect, useState } from 'react';
import { Calculator, ArrowLeft, CircleHelp, TableConfig } from 'lucide-react';
import { PlannerInputsPanel } from './components/inputs/PlannerInputsPanel';
import { ScenarioCards } from './components/scenarios/ScenarioCards';
import { ScenarioChart } from './components/dashboard/ScenarioChart';
import { ScenarioSummaryTable } from './components/dashboard/ScenarioSummaryTable';
import { YearDetailsTable } from './components/dashboard/YearDetailsTable';
import { TaxTableEditor } from './components/tax/TaxTableEditor';
import { useRetirementModel } from './hooks/useRetirementModel';
import { EconomicScenarioHelp } from './components/help/EconomicScenarioHelp';

type AppPage = 'planner' | 'taxes' | 'help';

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
    economicScenarioSettings,
    setEconomicScenarioSettings,
    projections
  } = useRetirementModel();

  const [selectedId, setSelectedId] = useState(projections[0]?.scenario.id ?? '');
  const [activePage, setActivePage] = useState<AppPage>('planner');
  const selected = projections.find((p) => p.scenario.id === selectedId) ?? projections[0];
  const summaries = projections.map((p) => p.summary);

  useEffect(() => {
    const selectedStillExists = projections.some((projection) => projection.scenario.id === selectedId);

    if (!selectedStillExists) {
      setSelectedId(projections[0]?.scenario.id ?? '');
    }
  }, [projections, selectedId]);

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
        <div className="header-actions">
          {activePage === 'planner' ? (
            <>
              <button className="header-button" onClick={() => setActivePage('taxes')}>
                <TableConfig />
                Tax Tables
              </button>
              <button className="header-button" onClick={() => setActivePage('help')}>
                <CircleHelp />
                Help
              </button>
            </>
          ) : (
            <button className="header-button" onClick={() => setActivePage('planner')}>
              <ArrowLeft />
              Back to Planner
            </button>
          )}
        </div>
      </header>
      {activePage === 'taxes' ? (
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
      ) : activePage === 'help' ? (
        <EconomicScenarioHelp />
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
            economicScenarioSettings={economicScenarioSettings}
            setEconomicScenarioSettings={setEconomicScenarioSettings}
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
