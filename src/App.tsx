import { useEffect, useState } from 'react';
import { Calculator, ArrowLeft, CircleHelp, TableConfig, Menu } from 'lucide-react';
import { PlannerInputsPanel } from './components/inputs/PlannerInputsPanel';
import { ScenarioCards } from './components/scenarios/ScenarioCards';
import { ScenarioChart } from './components/dashboard/ScenarioChart';
import { ScenarioSummaryTable } from './components/dashboard/ScenarioSummaryTable';
import { YearDetailsTable } from './components/dashboard/YearDetailsTable';
import { TaxTableEditor } from './components/tax/TaxTableEditor';
import { useRetirementModel } from './hooks/useRetirementModel';
import { EconomicScenarioHelp } from './components/help/EconomicScenarioHelp';
import { IrmaaTableEditor } from './components/irmaa/IrmaaTableEditor';
import { RetirementRiskAnalysis } from './components/dashboard/RetirementRiskAnalysis';

type AppPage = 'planner' | 'taxes' | 'irmaa' | 'help';

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
    irmaaConfigurations,
    setIrmaaConfigurations,
    economicScenarioSettings,
    setEconomicScenarioSettings,
    runRiskAnalysis,
    projections
  } = useRetirementModel();

  const [selectedId, setSelectedId] = useState(projections[0]?.scenario.id ?? '');
  const [activePage, setActivePage] = useState<AppPage>('planner');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
            Retirement Income Planner
          </h1>
          <p>
            Explore how income, spending, investments, Social Security, Roth conversions, taxes, Medicare, and market
            conditions shape retirement outcomes.
          </p>
        </div>
        <div className="header-actions">
          {activePage === 'planner' ? (
            <>
              <button className="header-button" onClick={() => setActivePage('taxes')}>
                <TableConfig />
                Tax Tables
              </button>
              <button className="header-button" onClick={() => setActivePage('irmaa')}>
                <TableConfig />
                IRMAA Tables
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
            configurations={taxConfig.federal}
            initialFilingStatus={inputs.filingStatus}
            onChange={(federal) => setTaxConfig({ ...taxConfig, federal })}
          />
          <TaxTableEditor
            title="State tax brackets"
            configurations={taxConfig.state}
            initialFilingStatus={inputs.filingStatus}
            initialStateCode={inputs.residenceState}
            onChange={(state) => setTaxConfig({ ...taxConfig, state })}
          />
        </main>
      ) : activePage === 'irmaa' ? (
        <IrmaaTableEditor configurations={irmaaConfigurations} onChange={setIrmaaConfigurations} />
      ) : activePage === 'help' ? (
        <EconomicScenarioHelp />
      ) : (
        <main className={`planner-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div id="planner-sidebar" className="sidebar-shell" aria-hidden={isSidebarCollapsed}>
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
          </div>
          <button
            className="sidebar-slide-toggle"
            type="button"
            aria-controls="planner-sidebar"
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Show planner inputs' : 'Hide planner inputs'}
            title={isSidebarCollapsed ? 'Show planner inputs' : 'Hide planner inputs'}
            onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}>
            <Menu />
          </button>
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
            <RetirementRiskAnalysis
              inputs={inputs}
              simulations={economicScenarioSettings.monteCarlo.simulations}
              selectedId={selected?.scenario.id ?? ''}
              onSelect={setSelectedId}
              runAnalysis={runRiskAnalysis}
            />
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
