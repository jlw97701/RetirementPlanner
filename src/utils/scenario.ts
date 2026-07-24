import { RetirementScenario, RothConversionType } from '../models/RetirementTypes';

export function getScenarioLabel(scenario: RetirementScenario): string {
  let lbl = scenario.claimAge === null ? 'Actual Social Security' : `Social Security at ${scenario.claimAge}`;

  lbl +=
    ' · ' +
    (scenario.rothConversionLabel ??
      (scenario.rothConvType === RothConversionType.None
        ? 'No'
        : scenario.rothConvType === RothConversionType.Fixed
          ? 'Fixed'
          : 'Optimized')) +
    ' Roth Conversion';

    return lbl;
}