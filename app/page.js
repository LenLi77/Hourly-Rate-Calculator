'use client';

import React, { useState } from 'react';
import { Clock } from 'lucide-react';

export default function HourlyWageConverter() {
  const [country, setCountry] = useState('EE');
  const [hourlyRate, setHourlyRate] = useState('15');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');

  const calendar = {
    EE: { name: 'Estonia', holidays: 12, vacation: 28 },
    LV: { name: 'Latvia', holidays: 14, vacation: 20 },
    LT: { name: 'Lithuania', holidays: 14, vacation: 20 }
  };

  const taxes = {
    EE: { income: 0.22, exemption: 700, unemployment: 0.016, pension: 0.02 },
    LV: { income: 0.255, exemption: 550, social: 0.105 },
    LT: { income: 0.20, social: 0.195 }
  };

  const rate = parseFloat(hourlyRate) || 0;
  const hours = parseFloat(hoursPerWeek) || 0;
  const cal = calendar[country];
  const tax = taxes[country];

  // Working days
  const workingDays = 365 - 104 - cal.holidays - cal.vacation;
  const hoursPerDay = hours / 5;
  const workingHours = workingDays * hoursPerDay;
  
  // Pay
  const dailyRate = rate * hoursPerDay;
  const annualGross = rate * workingHours;
  const monthlyGross = annualGross / 12;

  // Net calculation
  const getNet = (monthly) => {
    if (country === 'EE') {
      const taxable = Math.max(0, monthly - tax.exemption);
      return monthly - (taxable * tax.income) - (monthly * tax.unemployment) - (monthly * tax.pension);
    }
    if (country === 'LV') {
      const social = monthly * tax.social;
      const taxable = Math.max(0, monthly - social - tax.exemption);
      return monthly - (taxable * tax.income) - social;
    }
    const social = monthly * tax.social;
    return monthly - ((monthly - social) * tax.income) - social;
  };

  const netMonthly = getNet(monthlyGross);
  const netAnnual = netMonthly * 12;
  const totalTaxes = annualGross - netAnnual;

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
    <div className={`${bgColor} rounded-lg p-6 text-white ${borderColor}`}>
      <div className="text-xs uppercase tracking-wider opacity-80 mb-3">{title}</div>
      <div className="space-y-2">
        <div>
          <div className="text-xs opacity-70">Monthly</div>
          <div className="text-2xl font-light">€{monthly.toFixed(2)}</div>
        </div>
        <div className="pt-2 border-t border-slate-500">
          <div className="text-xs opacity-70">Annual</div>
          <div className="text-2xl font-light">€{annual.toFixed(2)}</div>
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
              <h1 className="text-3xl font-light text-slate-800">Hourly Wage Converter</h1>
            </div>
            <p className="text-slate-600 text-sm">
              Convert hourly rate to annual salary for {cal.name} (2026 calendar)
            </p>
          </div>

          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="EE">🇪🇪 Estonia</option>
                  <option value="LV">🇱🇻 Latvia</option>
                  <option value="LT">🇱🇹 Lithuania</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hourly Rate (€)</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="15"
                  step="0.5"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hours per Week</label>
                <input
                  type="number"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                  placeholder="40"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          <div className="mb-8 bg-slate-50 rounded-lg p-5 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">
              2026 Calendar for {cal.name}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-600">Calendar Days</div>
                <div className="text-lg font-semibold text-slate-800">365</div>
              </div>
              <div>
                <div className="text-slate-600">Weekend Days</div>
                <div className="text-lg font-semibold text-slate-800">104</div>
              </div>
              <div>
                <div className="text-slate-600">Public Holidays</div>
                <div className="text-lg font-semibold text-slate-800">{cal.holidays}</div>
              </div>
              <div>
                <div className="text-slate-600">Vacation Days</div>
                <div className="text-lg font-semibold text-slate-800">{cal.vacation}</div>
              </div>
            </div>
          </div>

          <div className="space-y-1 mb-8">
            <h3 className="text-lg font-medium text-slate-800 mb-4">Working Time</h3>
            <SimpleRow 
              label="Working Days per Year" 
              value={workingDays.toFixed(0)}
              info="After weekends, holidays, and vacation"
            />
            <SimpleRow 
              label="Working Hours per Year" 
              value={workingHours.toFixed(0)}
              info={`${hoursPerDay.toFixed(1)} hours/day × ${workingDays} days`}
            />
            <SimpleRow 
              label="Daily Rate" 
              value={`€${dailyRate.toFixed(2)}`}
              info={`€${rate.toFixed(2)}/hour × ${hoursPerDay.toFixed(1)} hours/day`}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-4">Compensation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard 
                title="Gross Pay"
                monthly={monthlyGross}
                annual={annualGross}
                bgColor="bg-slate-800"
                borderColor="border-l-4 border-red-600"
              />
              <SummaryCard 
                title="Taxes & Deductions"
                monthly={totalTaxes / 12}
                annual={totalTaxes}
                bgColor="bg-slate-700"
                note="Income tax, pension, social security"
              />
              <SummaryCard 
                title="Net Income"
                monthly={netMonthly}
                annual={netAnnual}
                bgColor="bg-slate-600"
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Calculations based on 2026 calendar with {cal.holidays} public holidays and {cal.vacation} vacation days for {cal.name}. 
              Tax calculations use standard employee rates.
              {country === 'EE' && ' This calculation does not account for shortened working days before public holidays in Estonia.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
