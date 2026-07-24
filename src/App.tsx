import { useEffect, useState } from 'react';
import { Calculator, ArrowLeft, CircleHelp, TableConfig, Menu } from 'lucide-react';
import { PlannerInputs } from './components/inputs/PlannerInputs';
import { ScenarioCards } from './components/dashboard/ScenarioCards';
import { ScenarioChart } from './components/dashboard/ScenarioChart';
import { ScenarioSummaryTable } from './components/dashboard/ScenarioSummaryTable';
import { YearDetailsTable } from './components/dashboard/YearDetailsTable';
import { TaxTableEditor } from './components/tax/TaxTableEditor';
import { useRetirementModel } from './hooks/useRetirementModel';
import { EconomicScenarioHelp } from './components/help/EconomicScenarioHelp';
import { IrmaaTableEditor } from './components/irmaa/IrmaaTableEditor';
import { RetirementRiskAnalysis } from './components/dashboard/RetirementRiskAnalysis';
import { resolveRiskMarketAssumption } from './services/RetirementRiskAnalysisService';
import { RothConversionOptimizer } from './components/dashboard/RothConversionOptimizer';
import type { ScenarioSummaryScrollRequest } from './components/dashboard/ScenarioSummaryTable';

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
    federalTaxConfig,
    rothConversionOptimizerSettings,
    setRothConversionOptimizerSettings,
    runRothConversionOptimizer,
    runOptimizerRiskAnalysis,
    applyOptimizedRothConversionSchedule,
    runRiskAnalysis,
    projections
  } = useRetirementModel();

  const [selectedId, setSelectedId] = useState(projections[0]?.scenario.id ?? '');
  const [activePage, setActivePage] = useState<AppPage>('planner');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [summaryScrollRequest, setSummaryScrollRequest] = useState<ScenarioSummaryScrollRequest>();
  const selected = projections.find((p) => p.scenario.id === selectedId) ?? projections[0];
  const summaries = projections.map((p) => p.summary);
  const riskMarketAssumption = resolveRiskMarketAssumption(economicScenarioSettings, assetAllocation);

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
            <PlannerInputs
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
            <ScenarioCards
              summaries={summaries}
              horizonAge={inputs.horizonAge}
              endAge={inputs.endAge}
              selectedId={selected?.scenario.id ?? ''}
              onSelect={(scenarioId) => {
                setSelectedId(scenarioId);
                setSummaryScrollRequest((current) => ({
                  scenarioId,
                  requestId: (current?.requestId ?? 0) + 1
                }));
              }}
            />
            <ScenarioSummaryTable
              summaries={summaries}
              inputs={inputs}
              selectedId={selected?.scenario.id ?? ''}
              onSelect={setSelectedId}
              scrollRequest={summaryScrollRequest}
            />
            {selected && (
              <>
                <ScenarioChart rows={selected.rows} scenario={selected.scenario} />
                <YearDetailsTable rows={selected.rows} scenario={selected.scenario} />
                <RothConversionOptimizer
                  inputs={inputs}
                  selectedScenario={selected.scenario}
                  federalTaxConfig={federalTaxConfig}
                  simulations={economicScenarioSettings.monteCarlo.simulations}
                  settings={rothConversionOptimizerSettings}
                  setSettings={setRothConversionOptimizerSettings}
                  runOptimizer={runRothConversionOptimizer}
                  runRiskAnalysis={runOptimizerRiskAnalysis}
                  onUseSchedule={(result) => {
                    const scenarioId = applyOptimizedRothConversionSchedule(result);
                    setSelectedId(scenarioId);
                    return scenarioId;
                  }}
                />
                <RetirementRiskAnalysis
                  inputs={inputs}
                  selectedScenario={selected.scenario}
                  simulations={economicScenarioSettings.monteCarlo.simulations}
                  marketAssumption={riskMarketAssumption}
                  selectedId={selected.scenario.id ?? ''}
                  onSelect={setSelectedId}
                  runAnalysis={runRiskAnalysis}
                />
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
