/*
 * Calendar-year value-weighted international developed-market returns in
 * U.S. dollars. The series is the "Mkt" return from the Fama/French
 * International Index Portfolios dataset. Countries are weighted using
 * EAFE plus Canada weights. The source uses MSCI data through 2006 and
 * Bloomberg data thereafter.
 *
 * Source and methodology:
 * https://mba.tuck.dartmouth.edu/pages/Faculty/ken.french/Data_Library/int_index_port_formed.html
 * https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html
 *
 * Source percentages are converted to decimal returns.
 */
export const INTERNATIONAL_STOCK_RETURNS: Readonly<Record<number, number>> = {
  1975: 0.3595,
  1976: 0.0401,
  1977: 0.1825,
  1978: 0.3267,
  1979: 0.0946,
  1980: 0.2292,
  1981: -0.0177,
  1982: -0.0264,
  1983: 0.2334,
  1984: 0.0617,
  1985: 0.5232,
  1986: 0.6629,
  1987: 0.2583,
  1988: 0.2448,
  1989: 0.1106,
  1990: -0.2182,
  1991: 0.1209,
  1992: -0.1287,
  1993: 0.3063,
  1994: 0.0906,
  1995: 0.1086,
  1996: 0.0753,
  1997: 0.0356,
  1998: 0.1977,
  1999: 0.3157,
  2000: -0.1348,
  2001: -0.2097,
  2002: -0.1337,
  2003: 0.4043,
  2004: 0.2089,
  2005: 0.1409,
  2006: 0.2599,
  2007: 0.1229,
  2008: -0.4266,
  2009: 0.3371,
  2010: 0.1192,
  2011: -0.126,
  2012: 0.1738,
  2013: 0.2258,
  2014: -0.0396,
  2015: -0.0051,
  2016: 0.0307,
  2017: 0.2677,
  2018: -0.1374,
  2019: 0.2198,
  2020: 0.1041,
  2021: 0.1248,
  2022: -0.1566,
  2023: 0.1583,
  2024: 0.0389,
  2025: 0.3217
};
