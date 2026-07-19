export enum EconomicScenarioMethod {
  DETERMINISTIC = 'DETERMINISTIC',
  HISTORICAL_SEQUENCE = 'HISTORICAL_SEQUENCE',
  HISTORICAL_BOOTSTRAP = 'HISTORICAL_BOOTSTRAP',
  MONTE_CARLO = 'MONTE_CARLO'
}

export interface EconomicYear {
  /**
   * Projection year, such as 2027.
   */
  year: number;

  /**
   * General consumer-price inflation rate.
   *
   * Example:
   * 0.025 = 2.5%
   */
  inflation: number;

  /**
   * Social Security cost-of-living adjustment.
   */
  socialSecurityCola: number;

  /**
   * Nominal annual total return for equities.
   */
  stockReturn: number;

  /**
   * Nominal annual total return for bonds.
   */
  bondReturn: number;

  /**
   * Nominal annual return for cash and cash equivalents.
   */
  cashReturn: number;

  /**
   * Nominal annual return for other investments.
   */
  otherReturn: number;

  /**
   * Optional historical source year when replaying historical data.
   */
  sourceYear?: number;
}

export interface HistoricalEconomicYear {
  year: number;
  inflation: number;
  socialSecurityCola: number;
  stockReturn: number;
  bondReturn: number;
  cashReturn: number;
  otherReturn: number;
}

export interface DeterministicScenarioConfig {
  method: EconomicScenarioMethod.DETERMINISTIC;
  startYear: number;
  years: number;

  inflation: number;
  socialSecurityCola?: number;
  stockReturn: number;
  bondReturn: number;
  cashReturn: number;
  otherReturn: number;

  /**
   * Official or manually supplied COLAs override projected values.
   *
   * Example:
   * {
   *   2027: 0.038
   * }
   */
  knownSocialSecurityColas?: Readonly<Record<number, number>>;
}

export interface HistoricalSequenceScenarioConfig {
  method: EconomicScenarioMethod.HISTORICAL_SEQUENCE;
  startYear: number;
  years: number;

  historicalData: readonly HistoricalEconomicYear[];

  /**
   * Historical year at which replay begins.
   */
  historicalStartYear: number;

  /**
   * When true, historical data wraps to the beginning if the requested
   * projection exceeds the available historical range.
   */
  wrap?: boolean;

  knownSocialSecurityColas?: Readonly<Record<number, number>>;
}

export interface HistoricalBootstrapScenarioConfig {
  method: EconomicScenarioMethod.HISTORICAL_BOOTSTRAP;
  startYear: number;
  years: number;

  historicalData: readonly HistoricalEconomicYear[];

  /**
   * Length of each contiguous block sampled from history.
   *
   * A block size greater than one preserves some year-to-year dependence.
   */
  blockSize?: number;

  seed?: number;

  knownSocialSecurityColas?: Readonly<Record<number, number>>;
}

export interface MonteCarloVariableAssumption {
  mean: number;
  standardDeviation: number;

  /**
   * Optional hard bounds used to prevent implausible generated values.
   */
  minimum?: number;
  maximum?: number;
}

export interface MonteCarloAssumptions {
  inflation: MonteCarloVariableAssumption;
  stockReturn: MonteCarloVariableAssumption;
  bondReturn: MonteCarloVariableAssumption;
  cashReturn: MonteCarloVariableAssumption;
  otherReturn: MonteCarloVariableAssumption;

  /**
   * Correlation matrix in this exact variable order:
   *
   * 0 = inflation
   * 1 = stock return
   * 2 = bond return
   * 3 = cash return
   */
  correlationMatrix: readonly [
    readonly [number, number, number, number, number],
    readonly [number, number, number, number, number],
    readonly [number, number, number, number, number],
    readonly [number, number, number, number, number],
    readonly [number, number, number, number, number]
  ];

  /**
   * COLA is derived from inflation using:
   *
   * cola = inflation * inflationSensitivity + spread
   */
  colaInflationSensitivity?: number;
  colaSpread?: number;
  colaMinimum?: number;
  colaMaximum?: number;
}

export interface MonteCarloScenarioConfig {
  method: EconomicScenarioMethod.MONTE_CARLO;
  startYear: number;
  years: number;

  assumptions: MonteCarloAssumptions;
  seed?: number;

  knownSocialSecurityColas?: Readonly<Record<number, number>>;
}

export type EconomicScenarioConfig =
  | DeterministicScenarioConfig
  | HistoricalSequenceScenarioConfig
  | HistoricalBootstrapScenarioConfig
  | MonteCarloScenarioConfig;

export interface EconomicScenario {
  id: string;
  method: EconomicScenarioMethod;
  seed?: number;
  years: EconomicYear[];
}

const DEFAULT_BOOTSTRAP_BLOCK_SIZE = 3;
const MATRIX_TOLERANCE = 1e-10;

export class EconomicScenarioEngine {
  public generate(config: EconomicScenarioConfig): EconomicScenario {
    validateBaseConfig(config);

    switch (config.method) {
      case EconomicScenarioMethod.DETERMINISTIC:
        return this.generateDeterministic(config);

      case EconomicScenarioMethod.HISTORICAL_SEQUENCE:
        return this.generateHistoricalSequence(config);

      case EconomicScenarioMethod.HISTORICAL_BOOTSTRAP:
        return this.generateHistoricalBootstrap(config);

      case EconomicScenarioMethod.MONTE_CARLO:
        return this.generateMonteCarlo(config);

      default:
        return assertNever(config);
    }
  }

  private generateDeterministic(config: DeterministicScenarioConfig): EconomicScenario {
    const years = Array.from({ length: config.years }, (_, index): EconomicYear => {
      const year = config.startYear + index;

      return {
        year,
        inflation: config.inflation,
        socialSecurityCola: getKnownOrProjectedCola(
          year,
          config.knownSocialSecurityColas,
          config.socialSecurityCola ?? config.inflation
        ),
        stockReturn: config.stockReturn,
        bondReturn: config.bondReturn,
        cashReturn: config.cashReturn,
        otherReturn: config.otherReturn
      };
    });

    return {
      id: createScenarioId(config.method),
      method: config.method,
      years
    };
  }

  private generateHistoricalSequence(config: HistoricalSequenceScenarioConfig): EconomicScenario {
    const historicalData = sortAndValidateHistoricalData(config.historicalData);

    const initialIndex = historicalData.findIndex((item) => item.year === config.historicalStartYear);

    if (initialIndex < 0) {
      throw new EconomicScenarioError(`Historical start year ${config.historicalStartYear} was not found.`);
    }

    const wrap = config.wrap ?? false;

    if (!wrap && initialIndex + config.years > historicalData.length) {
      throw new EconomicScenarioError('The requested projection extends beyond the available historical data.');
    }

    const years: EconomicYear[] = [];

    for (let index = 0; index < config.years; index++) {
      const historicalIndex = wrap ? (initialIndex + index) % historicalData.length : initialIndex + index;

      const source = historicalData[historicalIndex];
      const projectionYear = config.startYear + index;

      years.push(mapHistoricalYear(source, projectionYear, config.knownSocialSecurityColas));
    }

    return {
      id: createScenarioId(config.method),
      method: config.method,
      years
    };
  }

  private generateHistoricalBootstrap(config: HistoricalBootstrapScenarioConfig): EconomicScenario {
    const historicalData = sortAndValidateHistoricalData(config.historicalData);

    const blockSize = config.blockSize ?? DEFAULT_BOOTSTRAP_BLOCK_SIZE;

    if (!Number.isInteger(blockSize) || blockSize < 1) {
      throw new EconomicScenarioError('Bootstrap blockSize must be a positive integer.');
    }

    if (blockSize > historicalData.length) {
      throw new EconomicScenarioError('Bootstrap blockSize cannot exceed the historical dataset length.');
    }

    const seed = normalizeSeed(config.seed);
    const random = new SeededRandom(seed);
    const sampled: HistoricalEconomicYear[] = [];

    while (sampled.length < config.years) {
      const maximumStartIndex = historicalData.length - blockSize;
      const startIndex = random.nextInteger(0, maximumStartIndex);

      for (let offset = 0; offset < blockSize && sampled.length < config.years; offset++) {
        sampled.push(historicalData[startIndex + offset]);
      }
    }

    const years = sampled.map(
      (source, index): EconomicYear =>
        mapHistoricalYear(source, config.startYear + index, config.knownSocialSecurityColas)
    );

    return {
      id: createScenarioId(config.method, seed),
      method: config.method,
      seed,
      years
    };
  }

  private generateMonteCarlo(config: MonteCarloScenarioConfig): EconomicScenario {
    validateMonteCarloAssumptions(config.assumptions);

    const seed = normalizeSeed(config.seed);
    const random = new SeededRandom(seed);

    const choleskyMatrix = choleskyDecomposition(config.assumptions.correlationMatrix);

    const years: EconomicYear[] = [];

    for (let index = 0; index < config.years; index++) {
      const independentNormals = [
        random.nextStandardNormal(),
        random.nextStandardNormal(),
        random.nextStandardNormal(),
        random.nextStandardNormal(),
        random.nextStandardNormal()
      ];

      const correlatedNormals = multiplyLowerTriangularMatrix(choleskyMatrix, independentNormals);

      const inflation = sampleVariable(config.assumptions.inflation, correlatedNormals[0]);

      const stockReturn = sampleVariable(config.assumptions.stockReturn, correlatedNormals[1]);

      const bondReturn = sampleVariable(config.assumptions.bondReturn, correlatedNormals[2]);

      const cashReturn = sampleVariable(config.assumptions.cashReturn, correlatedNormals[3]);

      const otherReturn = sampleVariable(config.assumptions.otherReturn, correlatedNormals[4]);

      const projectionYear = config.startYear + index;

      const projectedCola = deriveSocialSecurityCola(inflation, config.assumptions);

      years.push({
        year: projectionYear,
        inflation,
        socialSecurityCola: getKnownOrProjectedCola(projectionYear, config.knownSocialSecurityColas, projectedCola),
        stockReturn,
        bondReturn,
        cashReturn,
        otherReturn
      });
    }

    return {
      id: createScenarioId(config.method, seed),
      method: config.method,
      seed,
      years
    };
  }
}

export class EconomicScenarioError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'EconomicScenarioError';
  }
}

function validateBaseConfig(config: EconomicScenarioConfig): void {
  if (!Number.isInteger(config.startYear)) {
    throw new EconomicScenarioError('startYear must be an integer.');
  }

  if (!Number.isInteger(config.years) || config.years < 1) {
    throw new EconomicScenarioError('years must be a positive integer.');
  }
}

function validateMonteCarloAssumptions(assumptions: MonteCarloAssumptions): void {
  validateVariableAssumption('inflation', assumptions.inflation);

  validateVariableAssumption('stockReturn', assumptions.stockReturn);

  validateVariableAssumption('bondReturn', assumptions.bondReturn);

  validateVariableAssumption('cashReturn', assumptions.cashReturn);

  validateVariableAssumption('otherReturn', assumptions.otherReturn);

  validateCorrelationMatrix(assumptions.correlationMatrix);

  /*
   * Cholesky decomposition also verifies that the matrix is
   * positive definite.
   */
  choleskyDecomposition(assumptions.correlationMatrix);
}

function validateVariableAssumption(name: string, assumption: MonteCarloVariableAssumption): void {
  if (!Number.isFinite(assumption.mean)) {
    throw new EconomicScenarioError(`${name}.mean must be finite.`);
  }

  if (!Number.isFinite(assumption.standardDeviation) || assumption.standardDeviation < 0) {
    throw new EconomicScenarioError(`${name}.standardDeviation must be nonnegative.`);
  }

  if (assumption.minimum !== undefined && assumption.maximum !== undefined && assumption.minimum > assumption.maximum) {
    throw new EconomicScenarioError(`${name}.minimum cannot exceed ${name}.maximum.`);
  }
}

function validateCorrelationMatrix(matrix: MonteCarloAssumptions['correlationMatrix']): void {
  const size = matrix.length;

  for (let row = 0; row < size; row++) {
    if (matrix[row].length !== size) {
      throw new EconomicScenarioError('Correlation matrix must be square.');
    }

    for (let column = 0; column < size; column++) {
      const value = matrix[row][column];

      if (!Number.isFinite(value) || value < -1 || value > 1) {
        throw new EconomicScenarioError('Correlation values must be between -1 and 1.');
      }

      if (Math.abs(value - matrix[column][row]) > MATRIX_TOLERANCE) {
        throw new EconomicScenarioError('Correlation matrix must be symmetric.');
      }
    }

    if (Math.abs(matrix[row][row] - 1) > MATRIX_TOLERANCE) {
      throw new EconomicScenarioError('Every diagonal value must equal 1.');
    }
  }
}

function sortAndValidateHistoricalData(data: readonly HistoricalEconomicYear[]): HistoricalEconomicYear[] {
  if (data.length === 0) {
    throw new EconomicScenarioError('Historical economic data cannot be empty.');
  }

  const sorted = [...data].sort((left, right) => left.year - right.year);

  for (let index = 0; index < sorted.length; index++) {
    validateHistoricalYear(sorted[index]);

    if (index > 0 && sorted[index].year === sorted[index - 1].year) {
      throw new EconomicScenarioError(`Duplicate historical year: ${sorted[index].year}.`);
    }
  }

  return sorted;
}

function validateHistoricalYear(item: HistoricalEconomicYear): void {
  if (!Number.isInteger(item.year)) {
    throw new EconomicScenarioError('Every historical year must be an integer.');
  }

  const values = [
    item.inflation,
    item.socialSecurityCola,
    item.stockReturn,
    item.bondReturn,
    item.cashReturn,
    item.otherReturn
  ];

  if (values.some((value) => !Number.isFinite(value))) {
    throw new EconomicScenarioError(`Historical data for ${item.year} contains a non-finite value.`);
  }
}

function mapHistoricalYear(
  source: HistoricalEconomicYear,
  projectionYear: number,
  knownColas?: Readonly<Record<number, number>>
): EconomicYear {
  return {
    year: projectionYear,
    inflation: source.inflation,
    socialSecurityCola: getKnownOrProjectedCola(projectionYear, knownColas, source.socialSecurityCola),
    stockReturn: source.stockReturn,
    bondReturn: source.bondReturn,
    cashReturn: source.cashReturn,
    otherReturn: source.otherReturn,
    sourceYear: source.year
  };
}

function deriveSocialSecurityCola(inflation: number, assumptions: MonteCarloAssumptions): number {
  const sensitivity = assumptions.colaInflationSensitivity ?? 1;

  const spread = assumptions.colaSpread ?? 0;
  const minimum = assumptions.colaMinimum ?? 0;
  const maximum = assumptions.colaMaximum ?? 0.1;

  return clamp(inflation * sensitivity + spread, minimum, maximum);
}

function getKnownOrProjectedCola(
  year: number,
  knownColas: Readonly<Record<number, number>> | undefined,
  projectedCola: number
): number {
  const knownCola = knownColas?.[year];

  return knownCola === undefined ? projectedCola : knownCola;
}

function sampleVariable(assumption: MonteCarloVariableAssumption, standardNormal: number): number {
  const sampled = assumption.mean + assumption.standardDeviation * standardNormal;

  return clamp(sampled, assumption.minimum ?? Number.NEGATIVE_INFINITY, assumption.maximum ?? Number.POSITIVE_INFINITY);
}

/**
 * Computes the lower-triangular Cholesky factor L where:
 *
 *     correlationMatrix = L × Lᵀ
 */
function choleskyDecomposition(matrix: MonteCarloAssumptions['correlationMatrix']): number[][] {
  const size = matrix.length;
  const result = Array.from({ length: size }, () => Array<number>(size).fill(0));

  for (let row = 0; row < size; row++) {
    for (let column = 0; column <= row; column++) {
      let sum = 0;

      for (let index = 0; index < column; index++) {
        sum += result[row][index] * result[column][index];
      }

      if (row === column) {
        const diagonal = matrix[row][row] - sum;

        if (diagonal <= MATRIX_TOLERANCE) {
          throw new EconomicScenarioError('The correlation matrix must be positive definite.');
        }

        result[row][column] = Math.sqrt(diagonal);
      } else {
        result[row][column] = (matrix[row][column] - sum) / result[column][column];
      }
    }
  }

  return result;
}

function multiplyLowerTriangularMatrix(matrix: readonly number[][], vector: readonly number[]): number[] {
  return matrix.map((row, rowIndex) => {
    let result = 0;

    for (let column = 0; column <= rowIndex; column++) {
      result += row[column] * vector[column];
    }

    return result;
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeSeed(seed?: number): number {
  if (seed === undefined) {
    return Date.now() >>> 0;
  }

  if (!Number.isFinite(seed)) {
    throw new EconomicScenarioError('The random seed must be finite.');
  }

  return Math.trunc(seed) >>> 0;
}

function createScenarioId(method: EconomicScenarioMethod, seed?: number): string {
  const suffix = seed === undefined ? cryptoRandomId() : seed.toString(16).padStart(8, '0');

  return `${method.toLowerCase()}-${suffix}`;
}

function cryptoRandomId(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    const values = new Uint32Array(2);
    globalThis.crypto.getRandomValues(values);

    return Array.from(values)
      .map((value) => value.toString(16).padStart(8, '0'))
      .join('');
  }

  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

function assertNever(value: never): never {
  throw new EconomicScenarioError(`Unsupported economic scenario method: ${String(value)}`);
}

/**
 * Mulberry32-based seeded pseudorandom-number generator.
 *
 * Suitable for reproducible simulations, but not for cryptographic use.
 */
class SeededRandom {
  private state: number;
  private spareNormal: number | undefined;

  public constructor(seed: number) {
    this.state = seed >>> 0;
  }

  public next(): number {
    this.state += 0x6d2b79f5;

    let value = this.state;

    value = Math.imul(value ^ (value >>> 15), value | 1);

    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }

  public nextInteger(minimumInclusive: number, maximumInclusive: number): number {
    if (
      !Number.isInteger(minimumInclusive) ||
      !Number.isInteger(maximumInclusive) ||
      minimumInclusive > maximumInclusive
    ) {
      throw new EconomicScenarioError('Invalid integer random range.');
    }

    return minimumInclusive + Math.floor(this.next() * (maximumInclusive - minimumInclusive + 1));
  }

  /**
   * Box-Muller transform with caching.
   */
  public nextStandardNormal(): number {
    if (this.spareNormal !== undefined) {
      const result = this.spareNormal;
      this.spareNormal = undefined;
      return result;
    }

    let firstUniform = 0;
    let secondUniform = 0;

    /*
     * Avoid log(0).
     */
    while (firstUniform === 0) {
      firstUniform = this.next();
    }

    while (secondUniform === 0) {
      secondUniform = this.next();
    }

    const magnitude = Math.sqrt(-2 * Math.log(firstUniform));

    const angle = 2 * Math.PI * secondUniform;

    const firstNormal = magnitude * Math.cos(angle);

    this.spareNormal = magnitude * Math.sin(angle);

    return firstNormal;
  }
}
