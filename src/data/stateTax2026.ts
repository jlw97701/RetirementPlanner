import type {
  FilingStatus,
  RetirementIncomeExclusion,
  StateCode,
  StateSocialSecurityTreatment,
  StateTaxConfig,
  TaxBracket
} from '../models/TaxTypes';

export interface StateOption {
  value: StateCode;
  label: string;
}

interface StateRate {
  lowerBound: number;
  rate: number;
}

interface AmountOrCredit {
  amount: number;
  isCredit: boolean;
}

interface StateTaxBaseline {
  code: StateCode;
  name: string;
  single: StateRate[];
  joint: StateRate[];
  singleDeduction: AmountOrCredit;
  jointDeduction: AmountOrCredit;
  singleExemption: AmountOrCredit;
  jointExemption: AmountOrCredit;
}

const SOURCE_URL = 'https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/';
const SOURCE_NAME = 'Tax Foundation 2026 state income tax survey with later enacted official rate updates';
const LAST_VERIFIED = '2026-07-21';

const STATE_TAX_BASELINES: StateTaxBaseline[] = [
  {
    code: 'AL',
    name: 'Alabama',
    single: [
      {
        lowerBound: 0,
        rate: 0.02
      },
      {
        lowerBound: 500,
        rate: 0.04
      },
      {
        lowerBound: 3000,
        rate: 0.05
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.02
      },
      {
        lowerBound: 1000,
        rate: 0.04
      },
      {
        lowerBound: 6000,
        rate: 0.05
      }
    ],
    singleDeduction: {
      amount: 3000,
      isCredit: false
    },
    jointDeduction: {
      amount: 8500,
      isCredit: false
    },
    singleExemption: {
      amount: 1500,
      isCredit: false
    },
    jointExemption: {
      amount: 3000,
      isCredit: false
    }
  },
  {
    code: 'AK',
    name: 'Alaska',
    single: [],
    joint: [],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'AZ',
    name: 'Arizona',
    single: [
      {
        lowerBound: 0,
        rate: 0.025
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.025
      }
    ],
    singleDeduction: {
      amount: 8350,
      isCredit: false
    },
    jointDeduction: {
      amount: 16700,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'AR',
    name: 'Arkansas',
    single: [
      {
        lowerBound: 0,
        rate: 0.02
      },
      {
        lowerBound: 4600,
        rate: 0.039
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.02
      },
      {
        lowerBound: 4600,
        rate: 0.039
      }
    ],
    singleDeduction: {
      amount: 2470,
      isCredit: false
    },
    jointDeduction: {
      amount: 4940,
      isCredit: false
    },
    singleExemption: {
      amount: 29,
      isCredit: true
    },
    jointExemption: {
      amount: 58,
      isCredit: true
    }
  },
  {
    code: 'CA',
    name: 'California',
    single: [
      {
        lowerBound: 0,
        rate: 0.01
      },
      {
        lowerBound: 11079,
        rate: 0.02
      },
      {
        lowerBound: 26264,
        rate: 0.04
      },
      {
        lowerBound: 41452,
        rate: 0.06
      },
      {
        lowerBound: 57542,
        rate: 0.08
      },
      {
        lowerBound: 72724,
        rate: 0.093
      },
      {
        lowerBound: 371479,
        rate: 0.103
      },
      {
        lowerBound: 445771,
        rate: 0.113
      },
      {
        lowerBound: 742953,
        rate: 0.123
      },
      {
        lowerBound: 1000000,
        rate: 0.133
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.01
      },
      {
        lowerBound: 22158,
        rate: 0.02
      },
      {
        lowerBound: 52528,
        rate: 0.04
      },
      {
        lowerBound: 82904,
        rate: 0.06
      },
      {
        lowerBound: 115084,
        rate: 0.08
      },
      {
        lowerBound: 145448,
        rate: 0.093
      },
      {
        lowerBound: 742958,
        rate: 0.103
      },
      {
        lowerBound: 891542,
        rate: 0.113
      },
      {
        lowerBound: 1000000,
        rate: 0.123
      },
      {
        lowerBound: 1485906,
        rate: 0.133
      }
    ],
    singleDeduction: {
      amount: 5540,
      isCredit: false
    },
    jointDeduction: {
      amount: 11080,
      isCredit: false
    },
    singleExemption: {
      amount: 153,
      isCredit: true
    },
    jointExemption: {
      amount: 306,
      isCredit: true
    }
  },
  {
    code: 'CO',
    name: 'Colorado',
    single: [
      {
        lowerBound: 0,
        rate: 0.044
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.044
      }
    ],
    singleDeduction: {
      amount: 16100,
      isCredit: false
    },
    jointDeduction: {
      amount: 32200,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'CT',
    name: 'Connecticut',
    single: [
      {
        lowerBound: 0,
        rate: 0.02
      },
      {
        lowerBound: 10000,
        rate: 0.045
      },
      {
        lowerBound: 50000,
        rate: 0.055
      },
      {
        lowerBound: 100000,
        rate: 0.06
      },
      {
        lowerBound: 200000,
        rate: 0.065
      },
      {
        lowerBound: 250000,
        rate: 0.069
      },
      {
        lowerBound: 500000,
        rate: 0.0699
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.02
      },
      {
        lowerBound: 20000,
        rate: 0.045
      },
      {
        lowerBound: 100000,
        rate: 0.055
      },
      {
        lowerBound: 200000,
        rate: 0.06
      },
      {
        lowerBound: 400000,
        rate: 0.065
      },
      {
        lowerBound: 500000,
        rate: 0.069
      },
      {
        lowerBound: 1000000,
        rate: 0.0699
      }
    ],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 15000,
      isCredit: false
    },
    jointExemption: {
      amount: 24000,
      isCredit: false
    }
  },
  {
    code: 'DE',
    name: 'Delaware',
    single: [
      {
        lowerBound: 2000,
        rate: 0.022
      },
      {
        lowerBound: 5000,
        rate: 0.039
      },
      {
        lowerBound: 10000,
        rate: 0.048
      },
      {
        lowerBound: 20000,
        rate: 0.052
      },
      {
        lowerBound: 25000,
        rate: 0.0555
      },
      {
        lowerBound: 60000,
        rate: 0.066
      }
    ],
    joint: [
      {
        lowerBound: 2000,
        rate: 0.022
      },
      {
        lowerBound: 5000,
        rate: 0.039
      },
      {
        lowerBound: 10000,
        rate: 0.048
      },
      {
        lowerBound: 20000,
        rate: 0.052
      },
      {
        lowerBound: 25000,
        rate: 0.0555
      },
      {
        lowerBound: 60000,
        rate: 0.066
      }
    ],
    singleDeduction: {
      amount: 3250,
      isCredit: false
    },
    jointDeduction: {
      amount: 6500,
      isCredit: false
    },
    singleExemption: {
      amount: 110,
      isCredit: true
    },
    jointExemption: {
      amount: 220,
      isCredit: true
    }
  },
  {
    code: 'FL',
    name: 'Florida',
    single: [],
    joint: [],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'GA',
    name: 'Georgia',
    single: [
      {
        lowerBound: 0,
        rate: 0.0499
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0499
      }
    ],
    singleDeduction: {
      amount: 12000,
      isCredit: false
    },
    jointDeduction: {
      amount: 24000,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'HI',
    name: 'Hawaii',
    single: [
      {
        lowerBound: 0,
        rate: 0.014
      },
      {
        lowerBound: 9600,
        rate: 0.032
      },
      {
        lowerBound: 14400,
        rate: 0.055
      },
      {
        lowerBound: 19200,
        rate: 0.064
      },
      {
        lowerBound: 24000,
        rate: 0.068
      },
      {
        lowerBound: 36000,
        rate: 0.072
      },
      {
        lowerBound: 48000,
        rate: 0.076
      },
      {
        lowerBound: 125000,
        rate: 0.079
      },
      {
        lowerBound: 175000,
        rate: 0.0825
      },
      {
        lowerBound: 225000,
        rate: 0.09
      },
      {
        lowerBound: 275000,
        rate: 0.1
      },
      {
        lowerBound: 325000,
        rate: 0.11
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.014
      },
      {
        lowerBound: 19200,
        rate: 0.032
      },
      {
        lowerBound: 28800,
        rate: 0.055
      },
      {
        lowerBound: 38400,
        rate: 0.064
      },
      {
        lowerBound: 48000,
        rate: 0.068
      },
      {
        lowerBound: 72000,
        rate: 0.072
      },
      {
        lowerBound: 96000,
        rate: 0.076
      },
      {
        lowerBound: 250000,
        rate: 0.079
      },
      {
        lowerBound: 350000,
        rate: 0.0825
      },
      {
        lowerBound: 450000,
        rate: 0.09
      },
      {
        lowerBound: 550000,
        rate: 0.1
      },
      {
        lowerBound: 650000,
        rate: 0.11
      }
    ],
    singleDeduction: {
      amount: 4400,
      isCredit: false
    },
    jointDeduction: {
      amount: 8800,
      isCredit: false
    },
    singleExemption: {
      amount: 1144,
      isCredit: false
    },
    jointExemption: {
      amount: 2288,
      isCredit: false
    }
  },
  {
    code: 'ID',
    name: 'Idaho',
    single: [
      {
        lowerBound: 4811,
        rate: 0.053
      }
    ],
    joint: [
      {
        lowerBound: 9622,
        rate: 0.053
      }
    ],
    singleDeduction: {
      amount: 16100,
      isCredit: false
    },
    jointDeduction: {
      amount: 32200,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'IL',
    name: 'Illinois',
    single: [
      {
        lowerBound: 0,
        rate: 0.0495
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0495
      }
    ],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 2925,
      isCredit: false
    },
    jointExemption: {
      amount: 5850,
      isCredit: false
    }
  },
  {
    code: 'IN',
    name: 'Indiana',
    single: [
      {
        lowerBound: 0,
        rate: 0.0295
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0295
      }
    ],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 1000,
      isCredit: false
    },
    jointExemption: {
      amount: 2000,
      isCredit: false
    }
  },
  {
    code: 'IA',
    name: 'Iowa',
    single: [
      {
        lowerBound: 0,
        rate: 0.038
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.038
      }
    ],
    singleDeduction: {
      amount: 16100,
      isCredit: false
    },
    jointDeduction: {
      amount: 32200,
      isCredit: false
    },
    singleExemption: {
      amount: 40,
      isCredit: true
    },
    jointExemption: {
      amount: 80,
      isCredit: true
    }
  },
  {
    code: 'KS',
    name: 'Kansas',
    single: [
      {
        lowerBound: 0,
        rate: 0.052
      },
      {
        lowerBound: 23000,
        rate: 0.0558
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.052
      },
      {
        lowerBound: 46000,
        rate: 0.0558
      }
    ],
    singleDeduction: {
      amount: 3605,
      isCredit: false
    },
    jointDeduction: {
      amount: 8240,
      isCredit: false
    },
    singleExemption: {
      amount: 9160,
      isCredit: false
    },
    jointExemption: {
      amount: 18320,
      isCredit: false
    }
  },
  {
    code: 'KY',
    name: 'Kentucky',
    single: [
      {
        lowerBound: 0,
        rate: 0.035
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.035
      }
    ],
    singleDeduction: {
      amount: 3360,
      isCredit: false
    },
    jointDeduction: {
      amount: 3360,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'LA',
    name: 'Louisiana',
    single: [
      {
        lowerBound: 0,
        rate: 0.03
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.03
      }
    ],
    singleDeduction: {
      amount: 12875,
      isCredit: false
    },
    jointDeduction: {
      amount: 25750,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'ME',
    name: 'Maine',
    single: [
      {
        lowerBound: 0,
        rate: 0.058
      },
      {
        lowerBound: 27399,
        rate: 0.0675
      },
      {
        lowerBound: 64849,
        rate: 0.0715
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.058
      },
      {
        lowerBound: 54849,
        rate: 0.0675
      },
      {
        lowerBound: 129749,
        rate: 0.0715
      }
    ],
    singleDeduction: {
      amount: 8350,
      isCredit: false
    },
    jointDeduction: {
      amount: 16700,
      isCredit: false
    },
    singleExemption: {
      amount: 5300,
      isCredit: false
    },
    jointExemption: {
      amount: 10600,
      isCredit: false
    }
  },
  {
    code: 'MD',
    name: 'Maryland',
    single: [
      {
        lowerBound: 0,
        rate: 0.02
      },
      {
        lowerBound: 1000,
        rate: 0.03
      },
      {
        lowerBound: 2000,
        rate: 0.04
      },
      {
        lowerBound: 3000,
        rate: 0.0475
      },
      {
        lowerBound: 100000,
        rate: 0.05
      },
      {
        lowerBound: 125000,
        rate: 0.0525
      },
      {
        lowerBound: 150000,
        rate: 0.055
      },
      {
        lowerBound: 250000,
        rate: 0.0575
      },
      {
        lowerBound: 500000,
        rate: 0.0625
      },
      {
        lowerBound: 1000000,
        rate: 0.065
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.02
      },
      {
        lowerBound: 1000,
        rate: 0.03
      },
      {
        lowerBound: 2000,
        rate: 0.04
      },
      {
        lowerBound: 3000,
        rate: 0.0475
      },
      {
        lowerBound: 150000,
        rate: 0.05
      },
      {
        lowerBound: 175000,
        rate: 0.0525
      },
      {
        lowerBound: 225000,
        rate: 0.055
      },
      {
        lowerBound: 300000,
        rate: 0.0575
      },
      {
        lowerBound: 600000,
        rate: 0.0625
      },
      {
        lowerBound: 1200000,
        rate: 0.065
      }
    ],
    singleDeduction: {
      amount: 3350,
      isCredit: false
    },
    jointDeduction: {
      amount: 6700,
      isCredit: false
    },
    singleExemption: {
      amount: 3200,
      isCredit: false
    },
    jointExemption: {
      amount: 6400,
      isCredit: false
    }
  },
  {
    code: 'MA',
    name: 'Massachusetts',
    single: [
      {
        lowerBound: 0,
        rate: 0.05
      },
      {
        lowerBound: 1083150,
        rate: 0.09
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.05
      },
      {
        lowerBound: 1083150,
        rate: 0.09
      }
    ],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 4400,
      isCredit: false
    },
    jointExemption: {
      amount: 8800,
      isCredit: false
    }
  },
  {
    code: 'MI',
    name: 'Michigan',
    single: [
      {
        lowerBound: 0,
        rate: 0.0425
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0425
      }
    ],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 5900,
      isCredit: false
    },
    jointExemption: {
      amount: 11800,
      isCredit: false
    }
  },
  {
    code: 'MN',
    name: 'Minnesota',
    single: [
      {
        lowerBound: 0,
        rate: 0.0535
      },
      {
        lowerBound: 33310,
        rate: 0.068
      },
      {
        lowerBound: 109430,
        rate: 0.0785
      },
      {
        lowerBound: 203150,
        rate: 0.0985
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0535
      },
      {
        lowerBound: 48700,
        rate: 0.068
      },
      {
        lowerBound: 193480,
        rate: 0.0785
      },
      {
        lowerBound: 337930,
        rate: 0.0985
      }
    ],
    singleDeduction: {
      amount: 15300,
      isCredit: false
    },
    jointDeduction: {
      amount: 30600,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'MS',
    name: 'Mississippi',
    single: [
      {
        lowerBound: 10000,
        rate: 0.04
      }
    ],
    joint: [
      {
        lowerBound: 10000,
        rate: 0.04
      }
    ],
    singleDeduction: {
      amount: 2300,
      isCredit: false
    },
    jointDeduction: {
      amount: 4600,
      isCredit: false
    },
    singleExemption: {
      amount: 6000,
      isCredit: false
    },
    jointExemption: {
      amount: 12000,
      isCredit: false
    }
  },
  {
    code: 'MO',
    name: 'Missouri',
    single: [
      {
        lowerBound: 1348,
        rate: 0.02
      },
      {
        lowerBound: 2696,
        rate: 0.025
      },
      {
        lowerBound: 4044,
        rate: 0.03
      },
      {
        lowerBound: 5392,
        rate: 0.035
      },
      {
        lowerBound: 6740,
        rate: 0.04
      },
      {
        lowerBound: 8088,
        rate: 0.045
      },
      {
        lowerBound: 9436,
        rate: 0.047
      }
    ],
    joint: [
      {
        lowerBound: 1348,
        rate: 0.02
      },
      {
        lowerBound: 2696,
        rate: 0.025
      },
      {
        lowerBound: 4044,
        rate: 0.03
      },
      {
        lowerBound: 5392,
        rate: 0.035
      },
      {
        lowerBound: 6740,
        rate: 0.04
      },
      {
        lowerBound: 8088,
        rate: 0.045
      },
      {
        lowerBound: 9436,
        rate: 0.047
      }
    ],
    singleDeduction: {
      amount: 16100,
      isCredit: false
    },
    jointDeduction: {
      amount: 32200,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'MT',
    name: 'Montana',
    single: [
      {
        lowerBound: 0,
        rate: 0.047
      },
      {
        lowerBound: 47500,
        rate: 0.0565
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.047
      },
      {
        lowerBound: 95000,
        rate: 0.0565
      }
    ],
    singleDeduction: {
      amount: 16100,
      isCredit: false
    },
    jointDeduction: {
      amount: 32200,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'NE',
    name: 'Nebraska',
    single: [
      {
        lowerBound: 0,
        rate: 0.0246
      },
      {
        lowerBound: 4130,
        rate: 0.0351
      },
      {
        lowerBound: 24760,
        rate: 0.0455
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0246
      },
      {
        lowerBound: 8250,
        rate: 0.0351
      },
      {
        lowerBound: 49530,
        rate: 0.0455
      }
    ],
    singleDeduction: {
      amount: 8850,
      isCredit: false
    },
    jointDeduction: {
      amount: 17700,
      isCredit: false
    },
    singleExemption: {
      amount: 176,
      isCredit: true
    },
    jointExemption: {
      amount: 352,
      isCredit: true
    }
  },
  {
    code: 'NV',
    name: 'Nevada',
    single: [],
    joint: [],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'NH',
    name: 'New Hampshire',
    single: [],
    joint: [],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'NJ',
    name: 'New Jersey',
    single: [
      {
        lowerBound: 0,
        rate: 0.014
      },
      {
        lowerBound: 20000,
        rate: 0.0175
      },
      {
        lowerBound: 35000,
        rate: 0.035
      },
      {
        lowerBound: 40000,
        rate: 0.0553
      },
      {
        lowerBound: 75000,
        rate: 0.0637
      },
      {
        lowerBound: 500000,
        rate: 0.0897
      },
      {
        lowerBound: 1000000,
        rate: 0.1075
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.014
      },
      {
        lowerBound: 20000,
        rate: 0.0175
      },
      {
        lowerBound: 50000,
        rate: 0.0245
      },
      {
        lowerBound: 70000,
        rate: 0.035
      },
      {
        lowerBound: 80000,
        rate: 0.0553
      },
      {
        lowerBound: 150000,
        rate: 0.0637
      },
      {
        lowerBound: 500000,
        rate: 0.0897
      },
      {
        lowerBound: 1000000,
        rate: 0.1075
      }
    ],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 1000,
      isCredit: false
    },
    jointExemption: {
      amount: 2000,
      isCredit: false
    }
  },
  {
    code: 'NM',
    name: 'New Mexico',
    single: [
      {
        lowerBound: 0,
        rate: 0.015
      },
      {
        lowerBound: 5500,
        rate: 0.032
      },
      {
        lowerBound: 16500,
        rate: 0.043
      },
      {
        lowerBound: 33500,
        rate: 0.047
      },
      {
        lowerBound: 66500,
        rate: 0.049
      },
      {
        lowerBound: 210000,
        rate: 0.059
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.015
      },
      {
        lowerBound: 8000,
        rate: 0.032
      },
      {
        lowerBound: 25000,
        rate: 0.043
      },
      {
        lowerBound: 50000,
        rate: 0.047
      },
      {
        lowerBound: 100000,
        rate: 0.049
      },
      {
        lowerBound: 315000,
        rate: 0.059
      }
    ],
    singleDeduction: {
      amount: 16100,
      isCredit: false
    },
    jointDeduction: {
      amount: 32200,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'NY',
    name: 'New York',
    single: [
      {
        lowerBound: 0,
        rate: 0.039
      },
      {
        lowerBound: 8500,
        rate: 0.044
      },
      {
        lowerBound: 11700,
        rate: 0.0515
      },
      {
        lowerBound: 13900,
        rate: 0.054
      },
      {
        lowerBound: 80650,
        rate: 0.059
      },
      {
        lowerBound: 215400,
        rate: 0.0685
      },
      {
        lowerBound: 1077550,
        rate: 0.0965
      },
      {
        lowerBound: 5000000,
        rate: 0.103
      },
      {
        lowerBound: 25000000,
        rate: 0.109
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.039
      },
      {
        lowerBound: 17150,
        rate: 0.044
      },
      {
        lowerBound: 23600,
        rate: 0.0515
      },
      {
        lowerBound: 27900,
        rate: 0.054
      },
      {
        lowerBound: 161550,
        rate: 0.059
      },
      {
        lowerBound: 323200,
        rate: 0.0685
      },
      {
        lowerBound: 2155350,
        rate: 0.0965
      },
      {
        lowerBound: 5000000,
        rate: 0.103
      },
      {
        lowerBound: 25000000,
        rate: 0.109
      }
    ],
    singleDeduction: {
      amount: 8000,
      isCredit: false
    },
    jointDeduction: {
      amount: 16050,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'NC',
    name: 'North Carolina',
    single: [
      {
        lowerBound: 0,
        rate: 0.0399
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0399
      }
    ],
    singleDeduction: {
      amount: 12750,
      isCredit: false
    },
    jointDeduction: {
      amount: 25500,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'ND',
    name: 'North Dakota',
    single: [
      {
        lowerBound: 48475,
        rate: 0.0195
      },
      {
        lowerBound: 244825,
        rate: 0.025
      }
    ],
    joint: [
      {
        lowerBound: 80975,
        rate: 0.0195
      },
      {
        lowerBound: 298075,
        rate: 0.025
      }
    ],
    singleDeduction: {
      amount: 16100,
      isCredit: false
    },
    jointDeduction: {
      amount: 32200,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'OH',
    name: 'Ohio',
    single: [
      {
        lowerBound: 26050,
        rate: 0.0275
      }
    ],
    joint: [
      {
        lowerBound: 26050,
        rate: 0.0275
      }
    ],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 2400,
      isCredit: false
    },
    jointExemption: {
      amount: 4800,
      isCredit: false
    }
  },
  {
    code: 'OK',
    name: 'Oklahoma',
    single: [
      {
        lowerBound: 3750,
        rate: 0.025
      },
      {
        lowerBound: 4900,
        rate: 0.035
      },
      {
        lowerBound: 7200,
        rate: 0.045
      }
    ],
    joint: [
      {
        lowerBound: 7500,
        rate: 0.025
      },
      {
        lowerBound: 9800,
        rate: 0.035
      },
      {
        lowerBound: 14400,
        rate: 0.045
      }
    ],
    singleDeduction: {
      amount: 6350,
      isCredit: false
    },
    jointDeduction: {
      amount: 12700,
      isCredit: false
    },
    singleExemption: {
      amount: 1000,
      isCredit: false
    },
    jointExemption: {
      amount: 2000,
      isCredit: false
    }
  },
  {
    code: 'OR',
    name: 'Oregon',
    single: [
      {
        lowerBound: 0,
        rate: 0.0475
      },
      {
        lowerBound: 4550,
        rate: 0.0675
      },
      {
        lowerBound: 11400,
        rate: 0.0875
      },
      {
        lowerBound: 125000,
        rate: 0.099
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0475
      },
      {
        lowerBound: 9100,
        rate: 0.0675
      },
      {
        lowerBound: 22800,
        rate: 0.0875
      },
      {
        lowerBound: 250000,
        rate: 0.099
      }
    ],
    singleDeduction: {
      amount: 2910,
      isCredit: false
    },
    jointDeduction: {
      amount: 5820,
      isCredit: false
    },
    singleExemption: {
      amount: 256,
      isCredit: true
    },
    jointExemption: {
      amount: 512,
      isCredit: true
    }
  },
  {
    code: 'PA',
    name: 'Pennsylvania',
    single: [
      {
        lowerBound: 0,
        rate: 0.0307
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0307
      }
    ],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'RI',
    name: 'Rhode Island',
    single: [
      {
        lowerBound: 0,
        rate: 0.0375
      },
      {
        lowerBound: 82050,
        rate: 0.0475
      },
      {
        lowerBound: 186450,
        rate: 0.0599
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0375
      },
      {
        lowerBound: 82050,
        rate: 0.0475
      },
      {
        lowerBound: 186450,
        rate: 0.0599
      }
    ],
    singleDeduction: {
      amount: 11200,
      isCredit: false
    },
    jointDeduction: {
      amount: 22400,
      isCredit: false
    },
    singleExemption: {
      amount: 5250,
      isCredit: false
    },
    jointExemption: {
      amount: 10500,
      isCredit: false
    }
  },
  {
    code: 'SC',
    name: 'South Carolina',
    single: [
      {
        lowerBound: 3640,
        rate: 0.03
      },
      {
        lowerBound: 18230,
        rate: 0.06
      }
    ],
    joint: [
      {
        lowerBound: 3640,
        rate: 0.03
      },
      {
        lowerBound: 18230,
        rate: 0.06
      }
    ],
    singleDeduction: {
      amount: 8350,
      isCredit: false
    },
    jointDeduction: {
      amount: 16700,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'SD',
    name: 'South Dakota',
    single: [],
    joint: [],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'TN',
    name: 'Tennessee',
    single: [],
    joint: [],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'TX',
    name: 'Texas',
    single: [],
    joint: [],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'UT',
    name: 'Utah',
    single: [
      {
        lowerBound: 0,
        rate: 0.0445
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0445
      }
    ],
    singleDeduction: {
      amount: 966,
      isCredit: true
    },
    jointDeduction: {
      amount: 1932,
      isCredit: true
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'VT',
    name: 'Vermont',
    single: [
      {
        lowerBound: 0,
        rate: 0.0335
      },
      {
        lowerBound: 49400,
        rate: 0.066
      },
      {
        lowerBound: 119700,
        rate: 0.076
      },
      {
        lowerBound: 249700,
        rate: 0.0875
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0335
      },
      {
        lowerBound: 82500,
        rate: 0.066
      },
      {
        lowerBound: 199450,
        rate: 0.076
      },
      {
        lowerBound: 304000,
        rate: 0.0875
      }
    ],
    singleDeduction: {
      amount: 7650,
      isCredit: false
    },
    jointDeduction: {
      amount: 15300,
      isCredit: false
    },
    singleExemption: {
      amount: 5300,
      isCredit: false
    },
    jointExemption: {
      amount: 10600,
      isCredit: false
    }
  },
  {
    code: 'VA',
    name: 'Virginia',
    single: [
      {
        lowerBound: 0,
        rate: 0.02
      },
      {
        lowerBound: 3000,
        rate: 0.03
      },
      {
        lowerBound: 5000,
        rate: 0.05
      },
      {
        lowerBound: 17000,
        rate: 0.0575
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.02
      },
      {
        lowerBound: 3000,
        rate: 0.03
      },
      {
        lowerBound: 5000,
        rate: 0.05
      },
      {
        lowerBound: 17000,
        rate: 0.0575
      }
    ],
    singleDeduction: {
      amount: 8750,
      isCredit: false
    },
    jointDeduction: {
      amount: 17500,
      isCredit: false
    },
    singleExemption: {
      amount: 930,
      isCredit: false
    },
    jointExemption: {
      amount: 1860,
      isCredit: false
    }
  },
  {
    code: 'WA',
    name: 'Washington',
    single: [],
    joint: [],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'WV',
    name: 'West Virginia',
    single: [
      {
        lowerBound: 0,
        rate: 0.0222
      },
      {
        lowerBound: 10000,
        rate: 0.0296
      },
      {
        lowerBound: 25000,
        rate: 0.0333
      },
      {
        lowerBound: 40000,
        rate: 0.0444
      },
      {
        lowerBound: 60000,
        rate: 0.0482
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.0222
      },
      {
        lowerBound: 10000,
        rate: 0.0296
      },
      {
        lowerBound: 25000,
        rate: 0.0333
      },
      {
        lowerBound: 40000,
        rate: 0.0444
      },
      {
        lowerBound: 60000,
        rate: 0.0482
      }
    ],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 2000,
      isCredit: false
    },
    jointExemption: {
      amount: 4000,
      isCredit: false
    }
  },
  {
    code: 'WI',
    name: 'Wisconsin',
    single: [
      {
        lowerBound: 0,
        rate: 0.035
      },
      {
        lowerBound: 15110,
        rate: 0.044
      },
      {
        lowerBound: 51950,
        rate: 0.053
      },
      {
        lowerBound: 332720,
        rate: 0.0765
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.035
      },
      {
        lowerBound: 20150,
        rate: 0.044
      },
      {
        lowerBound: 69260,
        rate: 0.053
      },
      {
        lowerBound: 443630,
        rate: 0.0765
      }
    ],
    singleDeduction: {
      amount: 13960,
      isCredit: false
    },
    jointDeduction: {
      amount: 25840,
      isCredit: false
    },
    singleExemption: {
      amount: 700,
      isCredit: false
    },
    jointExemption: {
      amount: 1400,
      isCredit: false
    }
  },
  {
    code: 'WY',
    name: 'Wyoming',
    single: [],
    joint: [],
    singleDeduction: {
      amount: 0,
      isCredit: false
    },
    jointDeduction: {
      amount: 0,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  },
  {
    code: 'DC',
    name: 'District of Columbia',
    single: [
      {
        lowerBound: 0,
        rate: 0.04
      },
      {
        lowerBound: 10000,
        rate: 0.06
      },
      {
        lowerBound: 40000,
        rate: 0.065
      },
      {
        lowerBound: 60000,
        rate: 0.085
      },
      {
        lowerBound: 250000,
        rate: 0.0925
      },
      {
        lowerBound: 500000,
        rate: 0.0975
      },
      {
        lowerBound: 1000000,
        rate: 0.1075
      }
    ],
    joint: [
      {
        lowerBound: 0,
        rate: 0.04
      },
      {
        lowerBound: 10000,
        rate: 0.06
      },
      {
        lowerBound: 40000,
        rate: 0.065
      },
      {
        lowerBound: 60000,
        rate: 0.085
      },
      {
        lowerBound: 250000,
        rate: 0.0925
      },
      {
        lowerBound: 500000,
        rate: 0.0975
      },
      {
        lowerBound: 1000000,
        rate: 0.1075
      }
    ],
    singleDeduction: {
      amount: 16100,
      isCredit: false
    },
    jointDeduction: {
      amount: 32200,
      isCredit: false
    },
    singleExemption: {
      amount: 0,
      isCredit: false
    },
    jointExemption: {
      amount: 0,
      isCredit: false
    }
  }
];

export const STATE_OPTIONS: StateOption[] = STATE_TAX_BASELINES
  .map(({ code, name }) => ({ value: code, label: name }))
  .sort((a, b) => a.label.localeCompare(b.label));

const SOCIAL_SECURITY_TAX_STATES = new Set<StateCode>(['CO', 'CT', 'MN', 'MT', 'NM', 'RI', 'UT', 'VT']);

function socialSecurityIncomeLimit(stateCode: StateCode, filingStatus: FilingStatus): number | undefined {
  const joint = filingStatus === 'marriedFilingJointly';
  const limits: Partial<Record<StateCode, [number, number]>> = {
    CT: [75_000, 100_000],
    MN: [82_000, 105_000],
    NM: [100_000, 150_000],
    RI: [95_000, 120_000],
    VT: [50_000, 65_000]
  };
  const limit = limits[stateCode];
  return limit ? limit[joint ? 1 : 0] : undefined;
}

function retirementIncomeExclusions(
  stateCode: StateCode,
  filingStatus: FilingStatus
): RetirementIncomeExclusion[] {
  const joint = filingStatus === 'marriedFilingJointly';
  switch (stateCode) {
    case 'AL': return [{ minimumAge: 65, maximumAmount: 12_000 }];
    case 'AR': return [{ minimumAge: 60, maximumAmount: 6_000 }];
    case 'CO': return [{ minimumAge: 65, maximumAmount: 24_000 }];
    case 'DE': return [{ minimumAge: 60, maximumAmount: 12_500 }];
    case 'GA': return [
      { minimumAge: 62, maximumAmount: 35_000 },
      { minimumAge: 65, maximumAmount: 65_000 }
    ];
    case 'IL': return [{ minimumAge: 0, maximumAmount: null }];
    case 'IA': return [{ minimumAge: 55, maximumAmount: null }];
    case 'KY': return [{ minimumAge: 0, maximumAmount: 31_110 }];
    case 'LA': return [{ minimumAge: 65, maximumAmount: 12_000 }];
    case 'ME': return [{ minimumAge: 0, maximumAmount: 48_216, reducedBySocialSecurity: true }];
    case 'MS': return [{ minimumAge: 59, maximumAmount: null }];
    case 'NJ': return [{ minimumAge: 62, maximumAmount: joint ? 100_000 : 75_000, incomeLimit: 150_000 }];
    case 'NY': return [{ minimumAge: 60, maximumAmount: 20_000 }];
    case 'OK': return [{ minimumAge: 0, maximumAmount: 10_000 }];
    case 'PA': return [{ minimumAge: 59, maximumAmount: null }];
    case 'RI': return [{ minimumAge: 67, maximumAmount: 20_000, incomeLimit: joint ? 120_000 : 95_000 }];
    case 'SC': return [{ minimumAge: 65, maximumAmount: 15_000 }];
    case 'VA': return [{ minimumAge: 65, maximumAmount: 12_000, phaseoutStart: joint ? 75_000 : 50_000 }];
    default: return [];
  }
}

function createBrackets(prefix: string, rates: StateRate[]): TaxBracket[] {
  return rates.map((item, index) => ({
    id: `${prefix}-${index}`,
    lowerBound: item.lowerBound,
    upperBound: rates[index + 1]?.lowerBound ?? null,
    rate: item.rate
  }));
}

function createConfiguration(
  baseline: StateTaxBaseline,
  filingStatus: FilingStatus
): StateTaxConfig {
  const usesJointSchedule = filingStatus === 'marriedFilingJointly';
  const rates = usesJointSchedule ? baseline.joint : baseline.single;
  const deduction = usesJointSchedule ? baseline.jointDeduction : baseline.singleDeduction;
  const exemption = usesJointSchedule ? baseline.jointExemption : baseline.singleExemption;
  const socialSecurityTreatment: StateSocialSecurityTreatment = SOCIAL_SECURITY_TAX_STATES.has(baseline.code)
    ? 'federalTaxableAmount'
    : 'exempt';
  const statusNote = filingStatus === 'marriedFilingSeparately'
    ? 'Married Filing Separately uses the published Single schedule as a planning approximation.'
    : filingStatus === 'headOfHousehold'
      ? 'Head of Household uses the published Single schedule as a planning approximation.'
      : '';

  return {
    jurisdiction: 'state',
    stateCode: baseline.code,
    stateName: baseline.name,
    year: 2026,
    filingStatus,
    taxModel: rates.length === 0 ? 'none' : rates.length === 1 && rates[0].lowerBound === 0 ? 'flat' : 'progressive',
    incomeBase: 'retirementIncome',
    brackets: createBrackets(`state-${baseline.code}-${filingStatus}`, rates),
    deductions: {
      standardDeduction: deduction.isCredit ? 0 : deduction.amount,
      additionalDeduction65: 0
    },
    socialSecurityTreatment,
    socialSecurityExemptionAge: baseline.code === 'CO' ? 65 : undefined,
    socialSecurityExemptionIncomeLimit: socialSecurityIncomeLimit(baseline.code, filingStatus),
    personalExemption: exemption.isCredit ? 0 : exemption.amount,
    personalCredit:
      (deduction.isCredit ? deduction.amount : 0) + (exemption.isCredit ? exemption.amount : 0),
    retirementIncomeExclusions: retirementIncomeExclusions(baseline.code, filingStatus),
    localTaxesIncluded: false,
    estimated: true,
    metadata: {
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      lastVerified: LAST_VERIFIED,
      notes: [
        'Planning estimate based on statewide ordinary-income rules; local taxes and many state-specific adjustments and credits are not modeled.',
        statusNote
      ].filter(Boolean).join(' ')
    }
  };
}

const FILING_STATUSES: FilingStatus[] = [
  'single',
  'marriedFilingJointly',
  'marriedFilingSeparately',
  'headOfHousehold'
];

export const STATE_2026_CONFIGURATIONS: StateTaxConfig[] = STATE_TAX_BASELINES.flatMap((baseline) =>
  FILING_STATUSES.map((filingStatus) => createConfiguration(baseline, filingStatus))
);
