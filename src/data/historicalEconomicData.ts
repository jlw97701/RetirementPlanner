import type { HistoricalEconomicYear } from '../services/EconomicScenarioEngine';

/*
 * Historical economic data, 1975-2025.
 *
 * Investment returns and inflation:
 *   Aswath Damodaran, NYU Stern, "Historical Returns on Stocks,
 *   Bonds and Bills - United States", updated January 2026.
 *   https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histret.html
 *
 * Proxies:
 *   stockReturn - S&P 500 total return, including dividends
 *   bondReturn  - modeled total return on a constant-maturity 10-year U.S. Treasury bond
 *   cashReturn  - average 3-month U.S. Treasury bill rate during the year
 *   inflation   - CPI-U, not seasonally adjusted
 *
 * Social Security COLA:
 *   U.S. Social Security Administration official COLA history.
 *   https://www.ssa.gov/oact/cola/colaseries.html
 *
 * The dataset starts in 1975, the first year of automatic Social Security
 * COLAs. Other is zero because no single defensible proxy represents the
 * REIT, precious-metals, and cryptocurrency assets allowed by that category.
 * Rates are decimal values and are rounded to six decimal places.
 */
export const HISTORICAL_ECONOMIC_DATA: readonly HistoricalEconomicYear[] = [
  { year: 1975, inflation: 0.069364, socialSecurityCola: 0.08, stockReturn: 0.369951, bondReturn: 0.036053, cashReturn: 0.057864, otherReturn: 0 },
  { year: 1976, inflation: 0.048649, socialSecurityCola: 0.064, stockReturn: 0.23831, bondReturn: 0.159846, cashReturn: 0.049766, otherReturn: 0 },
  { year: 1977, inflation: 0.06701, socialSecurityCola: 0.059, stockReturn: -0.069797, bondReturn: 0.0129, cashReturn: 0.05261, otherReturn: 0 },
  { year: 1978, inflation: 0.090177, socialSecurityCola: 0.065, stockReturn: 0.065093, bondReturn: -0.007776, cashReturn: 0.071783, otherReturn: 0 },
  { year: 1979, inflation: 0.132939, socialSecurityCola: 0.099, stockReturn: 0.185195, bondReturn: 0.006707, cashReturn: 0.100543, otherReturn: 0 },
  { year: 1980, inflation: 0.125163, socialSecurityCola: 0.143, stockReturn: 0.317352, bondReturn: -0.029897, cashReturn: 0.113919, otherReturn: 0 },
  { year: 1981, inflation: 0.089224, socialSecurityCola: 0.112, stockReturn: -0.047024, bondReturn: 0.081992, cashReturn: 0.140362, otherReturn: 0 },
  { year: 1982, inflation: 0.038298, socialSecurityCola: 0.074, stockReturn: 0.204191, bondReturn: 0.328145, cashReturn: 0.1109, otherReturn: 0 },
  { year: 1983, inflation: 0.03791, socialSecurityCola: 0.035, stockReturn: 0.223372, bondReturn: 0.032002, cashReturn: 0.0895, otherReturn: 0 },
  { year: 1984, inflation: 0.039487, socialSecurityCola: 0.035, stockReturn: 0.061461, bondReturn: 0.137334, cashReturn: 0.0992, otherReturn: 0 },
  { year: 1985, inflation: 0.037987, socialSecurityCola: 0.031, stockReturn: 0.312351, bondReturn: 0.257125, cashReturn: 0.0772, otherReturn: 0 },
  { year: 1986, inflation: 0.010979, socialSecurityCola: 0.013, stockReturn: 0.184946, bondReturn: 0.242842, cashReturn: 0.0615, otherReturn: 0 },
  { year: 1987, inflation: 0.044344, socialSecurityCola: 0.042, stockReturn: 0.058127, bondReturn: -0.049605, cashReturn: 0.0596, otherReturn: 0 },
  { year: 1988, inflation: 0.044194, socialSecurityCola: 0.04, stockReturn: 0.165372, bondReturn: 0.082236, cashReturn: 0.0689, otherReturn: 0 },
  { year: 1989, inflation: 0.046473, socialSecurityCola: 0.047, stockReturn: 0.314752, bondReturn: 0.176936, cashReturn: 0.0839, otherReturn: 0 },
  { year: 1990, inflation: 0.061063, socialSecurityCola: 0.054, stockReturn: -0.030645, bondReturn: 0.062354, cashReturn: 0.0775, otherReturn: 0 },
  { year: 1991, inflation: 0.030643, socialSecurityCola: 0.037, stockReturn: 0.302348, bondReturn: 0.150045, cashReturn: 0.0554, otherReturn: 0 },
  { year: 1992, inflation: 0.029007, socialSecurityCola: 0.03, stockReturn: 0.074937, bondReturn: 0.093616, cashReturn: 0.0351, otherReturn: 0 },
  { year: 1993, inflation: 0.027484, socialSecurityCola: 0.026, stockReturn: 0.099671, bondReturn: 0.14211, cashReturn: 0.0307, otherReturn: 0 },
  { year: 1994, inflation: 0.026749, socialSecurityCola: 0.028, stockReturn: 0.013259, bondReturn: -0.080367, cashReturn: 0.0437, otherReturn: 0 },
  { year: 1995, inflation: 0.025384, socialSecurityCola: 0.026, stockReturn: 0.371952, bondReturn: 0.234808, cashReturn: 0.0566, otherReturn: 0 },
  { year: 1996, inflation: 0.033225, socialSecurityCola: 0.029, stockReturn: 0.22681, bondReturn: 0.014286, cashReturn: 0.0515, otherReturn: 0 },
  { year: 1997, inflation: 0.017024, socialSecurityCola: 0.021, stockReturn: 0.331037, bondReturn: 0.099391, cashReturn: 0.052, otherReturn: 0 },
  { year: 1998, inflation: 0.016119, socialSecurityCola: 0.013, stockReturn: 0.28338, bondReturn: 0.149214, cashReturn: 0.0491, otherReturn: 0 },
  { year: 1999, inflation: 0.026846, socialSecurityCola: 0.025, stockReturn: 0.208854, bondReturn: -0.082542, cashReturn: 0.0478, otherReturn: 0 },
  { year: 2000, inflation: 0.033868, socialSecurityCola: 0.035, stockReturn: -0.090318, bondReturn: 0.166553, cashReturn: 0.06, otherReturn: 0 },
  { year: 2001, inflation: 0.015517, socialSecurityCola: 0.026, stockReturn: -0.118498, bondReturn: 0.055722, cashReturn: 0.0348, otherReturn: 0 },
  { year: 2002, inflation: 0.023769, socialSecurityCola: 0.014, stockReturn: -0.21966, bondReturn: 0.151164, cashReturn: 0.0164, otherReturn: 0 },
  { year: 2003, inflation: 0.018795, socialSecurityCola: 0.021, stockReturn: 0.283558, bondReturn: 0.003753, cashReturn: 0.0103, otherReturn: 0 },
  { year: 2004, inflation: 0.032556, socialSecurityCola: 0.027, stockReturn: 0.107428, bondReturn: 0.044907, cashReturn: 0.014, otherReturn: 0 },
  { year: 2005, inflation: 0.034157, socialSecurityCola: 0.041, stockReturn: 0.048345, bondReturn: 0.028675, cashReturn: 0.0322, otherReturn: 0 },
  { year: 2006, inflation: 0.025406, socialSecurityCola: 0.033, stockReturn: 0.156126, bondReturn: 0.01961, cashReturn: 0.0485, otherReturn: 0 },
  { year: 2007, inflation: 0.040813, socialSecurityCola: 0.023, stockReturn: 0.054847, bondReturn: 0.102099, cashReturn: 0.0448, otherReturn: 0 },
  { year: 2008, inflation: 0.000914, socialSecurityCola: 0.058, stockReturn: -0.365523, bondReturn: 0.201013, cashReturn: 0.014, otherReturn: 0 },
  { year: 2009, inflation: 0.027213, socialSecurityCola: 0, stockReturn: 0.259352, bondReturn: -0.111167, cashReturn: 0.0015, otherReturn: 0 },
  { year: 2010, inflation: 0.014957, socialSecurityCola: 0, stockReturn: 0.148211, bondReturn: 0.084629, cashReturn: 0.0014, otherReturn: 0 },
  { year: 2011, inflation: 0.029624, socialSecurityCola: 0.036, stockReturn: 0.020984, bondReturn: 0.160353, cashReturn: 0.0005, otherReturn: 0 },
  { year: 2012, inflation: 0.01741, socialSecurityCola: 0.017, stockReturn: 0.158906, bondReturn: 0.029716, cashReturn: 0.0009, otherReturn: 0 },
  { year: 2013, inflation: 0.015017, socialSecurityCola: 0.015, stockReturn: 0.321451, bondReturn: -0.091046, cashReturn: 0.0006, otherReturn: 0 },
  { year: 2014, inflation: 0.007565, socialSecurityCola: 0.017, stockReturn: 0.135244, bondReturn: 0.107462, cashReturn: 0.0003, otherReturn: 0 },
  { year: 2015, inflation: 0.007295, socialSecurityCola: 0, stockReturn: 0.013789, bondReturn: 0.012843, cashReturn: 0.0005, otherReturn: 0 },
  { year: 2016, inflation: 0.020746, socialSecurityCola: 0.003, stockReturn: 0.117731, bondReturn: 0.006906, cashReturn: 0.0032, otherReturn: 0 },
  { year: 2017, inflation: 0.021091, socialSecurityCola: 0.02, stockReturn: 0.216055, bondReturn: 0.028017, cashReturn: 0.0095, otherReturn: 0 },
  { year: 2018, inflation: 0.019102, socialSecurityCola: 0.028, stockReturn: -0.042269, bondReturn: -0.000167, cashReturn: 0.0197, otherReturn: 0 },
  { year: 2019, inflation: 0.022851, socialSecurityCola: 0.016, stockReturn: 0.312117, bondReturn: 0.096356, cashReturn: 0.0211, otherReturn: 0 },
  { year: 2020, inflation: 0.01362, socialSecurityCola: 0.013, stockReturn: 0.180232, bondReturn: 0.113319, cashReturn: 0.0036, otherReturn: 0 },
  { year: 2021, inflation: 0.070364, socialSecurityCola: 0.059, stockReturn: 0.284689, bondReturn: -0.04416, cashReturn: 0.0004, otherReturn: 0 },
  { year: 2022, inflation: 0.064544, socialSecurityCola: 0.087, stockReturn: -0.180375, bondReturn: -0.178282, cashReturn: 0.0209, otherReturn: 0 },
  { year: 2023, inflation: 0.033521, socialSecurityCola: 0.032, stockReturn: 0.260607, bondReturn: 0.0388, cashReturn: 0.0528, otherReturn: 0 },
  { year: 2024, inflation: 0.028881, socialSecurityCola: 0.025, stockReturn: 0.248786, bondReturn: -0.016372, cashReturn: 0.0518, otherReturn: 0 },
  { year: 2025, inflation: 0.027351, socialSecurityCola: 0.028, stockReturn: 0.177237, bondReturn: 0.077955, cashReturn: 0.0421, otherReturn: 0 }
];
