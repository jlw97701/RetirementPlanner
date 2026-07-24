export interface ProjectionPeriod {
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
  yearCount: number;
}

export function getProjectionPeriod(birthDate: string, startAge: number, endAge: number): ProjectionPeriod {
  if (!Number.isInteger(startAge) || !Number.isInteger(endAge)) {
    throw new Error('Projection ages must be integers.');
  }

  if (endAge < startAge) {
    throw new Error('End age cannot be less than start age.');
  }

  const birthYear = getBirthYear(birthDate);

  const startYear = birthYear + startAge;

  const endYear = birthYear + endAge;

  return {
    startYear,
    endYear,
    startDate: `${startYear}-01-01`,
    endDate: `${endYear}-12-31`,
    yearCount: endYear - startYear + 1
  };
}

export function parseIsoDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Expected date in YYYY-MM-DD format: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsed = new Date(year, month - 1, day);

  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    throw new Error(`Invalid date: ${value}`);
  }

  return parsed;
}

export function getBirthYear(birthDate: string): number {
  return parseIsoDate(birthDate).getFullYear();
}

