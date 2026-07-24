export type RothConversionIrmaaGuardrail = 'avoid-increase' | 'allow-first-tier' | 'ignore';

export interface RothConversionOptimizerSettings {
  /**
   * Highest federal marginal bracket the optimizer may fill.
   */
  maxFederalBracketRate: number;

  /**
   * Maximum requested conversion in any projection year.
   */
  maxAnnualConversion: number;

  /**
   * How much of the ending Traditional IRA is treated as a future tax liability
   * when strategies are compared.
   */
  terminalTraditionalTaxRate: number;

  /**
   * Limits the IRMAA tier caused two years after a conversion.
   */
  irmaaGuardrail: RothConversionIrmaaGuardrail;
}
