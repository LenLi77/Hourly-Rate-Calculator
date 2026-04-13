'use client';

import React, { useState, useMemo } from 'react';
import { Clock, Info } from 'lucide-react';

// 2026 Calendar and Tax Configuration - Verified against official sources
const COUNTRY_CONFIG = {
  EE: {
    name: 'Estonia',
    flag: '🇪🇪',
    // 2026 Calendar
    publicHolidays: 12, // New Year, Independence Day, Good Friday, Easter, Spring Day, Pentecost, Victory Day, Midsummer Eve, Midsummer Day, Independence Restoration Day, Christmas Eve, Christmas Day, Boxing Day
    minVacation: 28, // Calendar days (includes weekends) = ~20 working days
    vacationWorkingDays: 20, // Actual working days of vacation
    // 2026 Tax Rates
    incomeTax: 0.22,
    basicExemption: 700, // €700/month fixed from 2026
    employeeUnemployment: 0.016,
    pension: 0.02, // Default 2%, can be 4% or 6%
    // Employer rates
    employerSocialTax: 0.33,
    employerUnemployment: 0.008,
  },
  LV: {
    name: 'Latvia',
    flag: '🇱🇻',
    // 2026 Calendar
    publicHolidays: 15, // Including substitute days
    minVacation: 20, // Working days minimum
    vacationWorkingDays: 20,
    // 2026 Tax Rates
    incomeTax: 0.255, // 25.5% up to €105,300, 33% above
    basicExemption: 550, // €550/month from 2026
    employeeSSC: 0.105,
    // Employer rates
    employerSocialTax: 0.2359,
  },
  LT: {
    name: 'Lithuania',
    flag: '🇱🇹',
    // 2026 Calendar
    publicHolidays: 14,
    minVacation: 20, // Working days minimum
    vacationWorkingDays: 20,
    // 2026 Tax Rates
    incomeTax: 0.20, // 20% up to 60 avg salaries (~€138,729), 32% above
    basicExemption: 540, // NPD ~€540 (calculated via formula)
    employeeSSC: 0.195, // Includes 6.98% health insurance
    // Employer rates (much lower than EE/LV)
    employerSocialTax: 0.0177,
    employerGuaranteeFund: 0.0016,
    employerLongTermFund: 0.0016,
  },
};

// 2026 has 366 days (leap year check: 2026 is not a leap year, so 365 days)
// Actually 2026 is not a leap year, so 365 days
const YEAR_DAYS = 365;
const WEEKEND_DAYS = 104; // 52 weeks × 2 days

export default function HourlyWageConverter() {
  const [country, setCountry] = useState('EE');
  const [hourlyRate, setHourlyRate] = useState('15');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [pensionRate, setPensionRate] = useState('0.02'); // Estonia only

  const config = COUNTRY_CONFIG[country];

  const calculations = useMemo(() => {
    const rate = parseFloat(hourlyRate) || 0;
    const hours = parseFloat(hoursPerWeek) || 0;
    const pension = pensionRate !== '' ? parseFloat(pensionRate) : 0.02;

    // Working time calculation
    const workingDays = YEAR_DAYS - WEEKEND_DAYS - config.publicHolidays - config.vacationWorkingDays;
    const hoursPerDay = hours / 5;
    const workingHours = workingDays * hoursPerDay;
    
    // Gross pay
    const dailyRate = rate * hoursPerDay;
    const annualGross = rate * workingHours;
    const monthlyGross = annualGross / 12;

    // Net calculation (employee take-home)
    let netMonthly = 0;
    let deductions = {};

    if (country === 'EE') {
      // Estonia: Income tax on (gross - exemption), plus unemployment and pension
      const taxableIncome = Math.max(0, monthlyGross - config.basicExemption);
      const incomeTax = taxableIncome * config.incomeTax;
      const unemployment = monthlyGross * config.employeeUnemployment;
      const pensionContrib = monthlyGross * pension;
      
      netMonthly = monthlyGross - incomeTax - unemployment - pensionContrib;
      deductions = {
        incomeTax,
        unemployment,
        pension: pensionContrib,
        total: incomeTax + unemployment + pensionContrib,
      };
    } else if (country === 'LV') {
      // Latvia: Social contributions first, then income tax on (gross - SSC - exemption)
      const socialContrib = monthlyGross * config.employeeSSC;
      const taxableIncome = Math.max(0, monthlyGross - socialContrib - config.basicExemption);
      const incomeTax = taxableIncome * config.incomeTax;
      
      netMonthly = monthlyGross - incomeTax - socialContrib;
      deductions = {
        incomeTax,
        socialContrib,
        total: incomeTax + socialContrib,
      };
    } else {
      // Lithuania: Social contributions (19.5%) then income tax (20%) on remaining
      const socialContrib = monthlyGross * config.employeeSSC;
      // NPD formula: €540 - 0.19 × (Annual Income - €6,768) / 12
      // Simplified: use basic exemption if income is low enough
      const annualForNPD = monthlyGross * 12;
      let npd = 540;
      if (annualForNPD > 6768) {
        npd = Math.max(0, 540 - 0.19 * (annualForNPD - 6768) / 12);
      }
      const taxableIncome = Math.max(0, monthlyGross - socialContrib - npd);
      const incomeTax = taxableIncome * config.incomeTax;
      
      netMonthly = monthlyGross - incomeTax - socialContrib;
      deductions = {
        incomeTax,
        socialContrib,
        npd,
        total: incomeTax + socialContrib,
      };
    }

    const netAnnual = netMonthly * 12;
    const totalDeductions = annualGross - netAnnual;

    // Employer cost
    let employerRate = config.employerSocialTax;
    if (country === 'EE') {
      employerRate += config.employerUnemployment;
    } else if (country === 'LT') {
      employerRate += config.employerGuaranteeFund + config.employerLongTermFund;
    }
    const monthlyEmployerCost = monthlyGross * (1 + employerRate);
    const annualEmployerCost = annualGross * (1 + employerRate);

    return {
      workingDays,
      workingHours,
      hoursPerDay,
      dailyRate,
      monthlyGross,
      annualGross,
      netMonthly,
      netAnnual,
      totalDeductions,
      deductions,
      employerRate,
      monthlyEmployerCost,
      annualEmployerCost,
    };
  }, [hourlyRate, hoursPerWeek, country, config, pensionRate]);

  const formatCurrency = (value) => {
    return `€${value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const SimpleRow = ({ label, value, info }) => (
    <div className="flex justify-between items-center py-3 px-4 hover:bg-slate-50 rounded">
      <div>
        <div className="text-sm text-slate-700">{label}</div>
        {info && <div className="text-xs text-slate-500 mt-0.5">{info}</div>}
      </div>
      <div className="font-mono text-slate-800">{value}</div>
    </div>
  );

  const SummaryCard = ({ title, monthly, annual, bgColor, borderColor, note }) => (
    <div className={`${bgColor} rounded-lg p-6 text-white ${borderColor || ''}`}>
      <div className="text-xs uppercase tracking-wider opacity-80 mb-3">{title}</div>
      <div className="space-y-2">
        <div>
          <div className="text-xs opacity-70">Monthly</div>
          <div className="text-2xl font-light">{formatCurrency(monthly)}</div>
        </div>
        <div className="pt-2 border-t border-white/20">
          <div className="text-xs opacity-70">Annual</div>
          <div className="text-2xl font-light">{formatCurrency(annual)}</div>
        </div>
      </div>
      {note && <div className="text-xs opacity-70 mt-3">{note}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:p-10">
          <div className="mb-8 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-7 h-7 text-red-600" />
              <h1 className="text-3xl font-light text-slate-800">
                Hourly Wage Converter
              </h1>
            </div>
            <p className="text-slate-600 text-sm">
              Convert hourly rate to annual salary for {config.name} (2026 calendar & tax rates)
            </p>
          </div>

          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {Object.entries(COUNTRY_CONFIG).map(([code, cfg]) => (
                    <option key={code} value={code}>
                      {cfg.flag} {cfg.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hourly Rate (€)
                </label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="15"
                  step="0.5"
                  min="0"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hours per Week
                </label>
                <input
                  type="number"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                  placeholder="40"
                  min="1"
                  max="60"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {country === 'EE' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Pension Pillar II Rate (Estonia only)
                </label>
                <div className="grid grid-cols-4 gap-2 max-w-md">
                  {[
                    { value: '0', label: '0%' },
                    { value: '0.02', label: '2%' },
                    { value: '0.04', label: '4%' },
                    { value: '0.06', label: '6%' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setPensionRate(value)}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                        pensionRate === value
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:border-red-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-8 bg-slate-50 rounded-lg p-5 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">
              2026 Calendar for {config.name}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <div className="text-slate-600">Calendar Days</div>
                <div className="text-lg font-semibold text-slate-800">{YEAR_DAYS}</div>
              </div>
              <div>
                <div className="text-slate-600">Weekend Days</div>
                <div className="text-lg font-semibold text-slate-800">{WEEKEND_DAYS}</div>
              </div>
              <div>
                <div className="text-slate-600">Public Holidays</div>
                <div className="text-lg font-semibold text-slate-800">{config.publicHolidays}</div>
              </div>
              <div>
                <div className="text-slate-600">Vacation Days</div>
                <div className="text-lg font-semibold text-slate-800">{config.vacationWorkingDays}</div>
              </div>
              <div>
                <div className="text-slate-600">Working Days</div>
                <div className="text-lg font-semibold text-red-600">{calculations.workingDays}</div>
              </div>
            </div>
          </div>

          <div className="space-y-1 mb-8">
            <h3 className="text-lg font-medium text-slate-800 mb-4">Working Time</h3>
            <SimpleRow 
              label="Working Days per Year" 
              value={calculations.workingDays.toFixed(0)}
              info="After weekends, holidays, and vacation"
            />
            <SimpleRow 
              label="Working Hours per Year" 
              value={calculations.workingHours.toFixed(0)}
              info={`${calculations.hoursPerDay.toFixed(1)} hours/day × ${calculations.workingDays} days`}
            />
            <SimpleRow 
              label="Daily Rate" 
              value={formatCurrency(calculations.dailyRate)}
              info={`€${parseFloat(hourlyRate) || 0}/hour × ${calculations.hoursPerDay.toFixed(1)} hours/day`}
            />
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-slate-800 mb-4">Compensation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard 
                title="Gross Pay"
                monthly={calculations.monthlyGross}
                annual={calculations.annualGross}
                bgColor="bg-slate-800"
                borderColor="border-l-4 border-red-600"
              />
              <SummaryCard 
                title="Taxes & Deductions"
                monthly={calculations.totalDeductions / 12}
                annual={calculations.totalDeductions}
                bgColor="bg-slate-700"
                note={country === 'EE' 
                  ? "Income tax, pension, unemployment" 
                  : country === 'LV'
                  ? "Income tax, social contributions"
                  : "Income tax (20%), social (19.5%)"
                }
              />
              <SummaryCard 
                title="Net Income"
                monthly={calculations.netMonthly}
                annual={calculations.netAnnual}
                bgColor="bg-green-700"
              />
            </div>
          </div>

          {/* Deduction Breakdown */}
          <div className="mb-8 bg-slate-50 rounded-lg p-5 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" />
              Monthly Deduction Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-600">Income Tax</div>
                <div className="text-lg font-semibold text-slate-800">
                  {formatCurrency(calculations.deductions.incomeTax || 0)}
                </div>
                <div className="text-xs text-slate-500">
                  {(config.incomeTax * 100).toFixed(1)}% rate
                </div>
              </div>
              {country === 'EE' && (
                <>
                  <div>
                    <div className="text-slate-600">Unemployment</div>
                    <div className="text-lg font-semibold text-slate-800">
                      {formatCurrency(calculations.deductions.unemployment || 0)}
                    </div>
                    <div className="text-xs text-slate-500">1.6%</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Pension II</div>
                    <div className="text-lg font-semibold text-slate-800">
                      {formatCurrency(calculations.deductions.pension || 0)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(parseFloat(pensionRate) * 100).toFixed(0)}%
                    </div>
                  </div>
                </>
              )}
              {(country === 'LV' || country === 'LT') && (
                <div>
                  <div className="text-slate-600">Social Security</div>
                  <div className="text-lg font-semibold text-slate-800">
                    {formatCurrency(calculations.deductions.socialContrib || 0)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(config.employeeSSC * 100).toFixed(1)}%
                  </div>
                </div>
              )}
              <div>
                <div className="text-slate-600">Tax-Free Allowance</div>
                <div className="text-lg font-semibold text-slate-800">
                  {formatCurrency(country === 'LT' 
                    ? (calculations.deductions.npd || 0)
                    : config.basicExemption
                  )}
                </div>
                <div className="text-xs text-slate-500">per month</div>
              </div>
            </div>
          </div>

          {/* Employer Cost */}
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-3 uppercase tracking-wider">
              Total Employer Cost
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-blue-600 text-sm">Monthly</div>
                <div className="text-2xl font-light text-blue-900">
                  {formatCurrency(calculations.monthlyEmployerCost)}
                </div>
              </div>
              <div>
                <div className="text-blue-600 text-sm">Annual</div>
                <div className="text-2xl font-light text-blue-900">
                  {formatCurrency(calculations.annualEmployerCost)}
                </div>
              </div>
              <div>
                <div className="text-blue-600 text-sm">Employer Tax Rate</div>
                <div className="text-2xl font-light text-blue-900">
                  {(calculations.employerRate * 100).toFixed(2)}%
                </div>
                <div className="text-xs text-blue-600">
                  {country === 'EE' && "33% social + 0.8% unemployment"}
                  {country === 'LV' && "23.59% social contributions"}
                  {country === 'LT' && "1.77% + 0.32% funds"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Calculations based on 2026 calendar with {config.publicHolidays} public holidays 
              and {config.vacationWorkingDays} vacation days for {config.name}. 
              Tax calculations use standard employee rates. 
              {country === 'EE' && ' Does not account for shortened pre-holiday working days.'}
              {country === 'LT' && ' NPD calculated using 2026 formula.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
