import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

// ── EMI Calculation Helpers ────────────────────────────────────────────────────

/**
 * Flat Rate Schedule:
 * - For Monthly / Quarterly / Half-Yearly / Yearly: Fixed interest on full principal each period.
 * - For Daily / Weekly / Fortnightly: Interest is calculated on the remaining balance each period.
 */
const calcFlatSchedule = (principal, roiPercent, totalPeriods, freqFactor, frequency) => {
  const isSubMonthly = ['Daily', 'Weekly', 'Fortnightly'].includes(frequency);
  const periodRate = roiPercent / 100 / freqFactor;

  if (isSubMonthly) {
    // Total interest on diminishing balance = P * (N + 1) / 2 * periodRate
    const totalInterest = parseFloat((((principal * (totalPeriods + 1)) / 2) * periodRate).toFixed(2));
    const totalPayment = principal + totalInterest;
    const emi = parseFloat((totalPayment / totalPeriods).toFixed(2));

    const rows = [];
    let balance = principal;
    let accumulatedInterest = 0;
    let accumulatedPrincipal = 0;

    for (let i = 1; i <= totalPeriods; i++) {
      const interest = parseFloat((balance * periodRate).toFixed(2));
      let amt = parseFloat((emi - interest).toFixed(2));
      if (i === totalPeriods) {
        amt = parseFloat(balance.toFixed(2));
      }
      balance = parseFloat((balance - amt).toFixed(2));
      if (Math.abs(balance) < 0.01) balance = 0;

      accumulatedInterest += interest;
      accumulatedPrincipal += amt;

      rows.push({
        sno: i,
        emi,
        amount: amt,
        interest,
        balance,
      });
    }

    return {
      rows,
      totalEmi: parseFloat((emi * totalPeriods).toFixed(2)),
      totalPrincipal: principal,
      totalInterest: parseFloat(accumulatedInterest.toFixed(2)),
    };
  }

  // Standard Monthly/Yearly Flat calculation
  const interestPerPeriod = parseFloat((principal * periodRate).toFixed(2));
  const totalInterest = parseFloat((interestPerPeriod * totalPeriods).toFixed(2));
  const principalPerPeriod = parseFloat((principal / totalPeriods).toFixed(2));
  const emi = parseFloat((principalPerPeriod + interestPerPeriod).toFixed(2));

  const rows = [];
  let balance = principal;

  for (let i = 1; i <= totalPeriods; i++) {
    const amt = i < totalPeriods ? principalPerPeriod : parseFloat(balance.toFixed(2));
    balance = parseFloat((balance - amt).toFixed(2));
    rows.push({
      sno: i,
      emi,
      amount: amt,
      interest: interestPerPeriod,
      balance: Math.abs(balance) < 0.01 ? 0 : balance,
    });
  }

  return {
    rows,
    totalEmi: parseFloat((emi * totalPeriods).toFixed(2)),
    totalPrincipal: principal,
    totalInterest,
  };
};

/**
 * Declining Balance (Reducing): Interest is calculated on the outstanding balance.
 *   r = ROI / (100 × periodsPerYear)
 *   EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 *   Tenure = number of installments directly
 */
const calcReducingSchedule = (principal, roiPercent, totalPeriods, freqFactor) => {
  const r = roiPercent / 100 / freqFactor;

  let emi;
  if (r === 0) {
    emi = parseFloat((principal / totalPeriods).toFixed(2));
  } else {
    const compound = Math.pow(1 + r, totalPeriods);
    emi = parseFloat(((principal * r * compound) / (compound - 1)).toFixed(2));
  }

  const rows = [];
  let balance = principal;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  for (let i = 1; i <= totalPeriods; i++) {
    const interest = parseFloat((balance * r).toFixed(2));
    let amt = parseFloat((emi - interest).toFixed(2));
    if (i === totalPeriods) {
      amt = parseFloat(balance.toFixed(2));
    }
    balance = parseFloat((balance - amt).toFixed(2));
    if (Math.abs(balance) < 0.01) balance = 0;

    totalInterestPaid += interest;
    totalPrincipalPaid += amt;

    rows.push({ sno: i, emi, amount: amt, interest, balance });
  }

  return {
    rows,
    totalEmi: parseFloat((emi * totalPeriods).toFixed(2)),
    totalPrincipal: parseFloat(totalPrincipalPaid.toFixed(2)),
    totalInterest: parseFloat(totalInterestPaid.toFixed(2)),
  };
};

/**
 * FREQUENCY_MAP: actual periods per year
 *   Daily       = 365 days
 *   Weekly      = 52 weeks
 *   Fortnightly = 26 fortnights
 *   Monthly     = 12
 *   Quarterly   = 4
 *   Half-Yearly = 2
 *   Yearly      = 1
 */
const FREQUENCY_MAP = {
  Daily: 365,
  Weekly: 52,
  Fortnightly: 26,
  Monthly: 12,
  Quarterly: 4,
  'Half-Yearly': 2,
  Yearly: 1,
};

// ── Component ─────────────────────────────────────────────────────────────────

const LoanCalculator = () => {
  const today = new Date().toISOString().split('T')[0];

  const [interestType, setInterestType] = useState('Flat');
  const [loanDate, setLoanDate] = useState(today);
  const [loanAmount, setLoanAmount] = useState('1000');
  const [roi, setRoi] = useState('23');
  const [tenure, setTenure] = useState('6');
  const [frequency, setFrequency] = useState('Monthly');
  const [roundOff, setRoundOff] = useState(false);
  const [result, setResult] = useState(null);

  /** Format a number: round to whole if roundOff, else 2 decimal places */
  const fmt = (n) =>
    (roundOff ? Math.floor(n) : n).toLocaleString('en-IN', {
      maximumFractionDigits: roundOff ? 0 : 2,
    });

  const handleCalculate = () => {
    const P = parseFloat(loanAmount);
    const R = parseFloat(roi);
    const T = parseFloat(tenure);
    const freqFactor = FREQUENCY_MAP[frequency] || 12;

    if (!P || !R || !T || P <= 0 || R <= 0 || T <= 0) {
      alert('Please fill all fields with valid positive values.');
      return;
    }

    const calc =
      interestType === 'Flat'
        ? calcFlatSchedule(P, R, T, freqFactor, frequency)
        : calcReducingSchedule(P, R, T, freqFactor);

    setResult(calc);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputCls =
    'bg-white border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full';
  const labelCls = 'text-xs font-semibold text-gray-700 mb-0.5 block';

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{
        background: `
          radial-gradient(ellipse at 50% 50%, rgba(200,210,240,0.18) 0%, transparent 70%),
          #f0f2f8
        `,
      }}
    >
      {/* ── Banner ────────────────────────────────────────────────────────── */}
      <div className="bg-[#3B3C6E] text-white px-4 py-2.5 rounded-t-lg font-semibold text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm">
        <Calculator className="w-4 h-4 text-purple-200" />
        Loan Calculator
      </div>

      {/* ── Form Card ─────────────────────────────────────────────────────── */}
      <div
        className="bg-white/80 backdrop-blur border-x border-b border-gray-200 shadow-sm rounded-b-lg p-5 mb-6"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300'%3E%3Cg stroke='%23c5cae9' stroke-width='0.6' opacity='0.4' fill='none'%3E%3Ccircle cx='150' cy='150' r='80'/%3E%3Ccircle cx='300' cy='100' r='50'/%3E%3Ccircle cx='450' cy='180' r='60'/%3E%3Cline x1='150' y1='150' x2='300' y2='100'/%3E%3Cline x1='300' y1='100' x2='450' y2='180'/%3E%3Cline x1='150' y1='150' x2='450' y2='180'/%3E%3Ccircle cx='90' cy='80' r='5'/%3E%3Ccircle cx='500' cy='60' r='5'/%3E%3Ccircle cx='550' cy='220' r='5'/%3E%3Cline x1='90' y1='80' x2='150' y2='150'/%3E%3Cline x1='500' y1='60' x2='450' y2='180'/%3E%3Cline x1='550' y1='220' x2='450' y2='180'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center right',
          backgroundSize: '50%',
        }}
      >
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className={labelCls}>Select Interest Type</label>
            <select
              value={interestType}
              onChange={(e) => { setInterestType(e.target.value); setResult(null); }}
              className={inputCls}
            >
              <option value="Flat">Flat</option>
              <option value="Declining Balance">Declining Balance</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Loan Date</label>
            <input
              type="date"
              value={loanDate}
              onChange={(e) => setLoanDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Loan Amount</label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => { setLoanAmount(e.target.value); setResult(null); }}
              placeholder="Enter amount"
              className={inputCls}
              min="0"
            />
          </div>

          <div>
            <label className={labelCls}>ROI(%)</label>
            <input
              type="number"
              value={roi}
              onChange={(e) => { setRoi(e.target.value); setResult(null); }}
              placeholder="Rate of Interest"
              className={inputCls}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className={labelCls}>Loan Tenure</label>
            <input
              type="number"
              value={tenure}
              onChange={(e) => { setTenure(e.target.value); setResult(null); }}
              placeholder="Months"
              className={inputCls}
              min="1"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className={labelCls}>Frequency</label>
            <select
              value={frequency}
              onChange={(e) => { setFrequency(e.target.value); setResult(null); }}
              className={inputCls}
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Fortnightly">Fortnightly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          {/* Round Off toggle */}
          <div className="flex flex-col justify-end">
            <label className={labelCls}>Round Off Amount</label>
            <button
              type="button"
              onClick={() => setRoundOff((v) => !v)}
              className={`relative inline-flex items-center h-7 w-14 rounded-full border-2 transition-colors duration-200 focus:outline-none ${
                roundOff
                  ? 'bg-[#2D336B] border-[#2D336B]'
                  : 'bg-gray-200 border-gray-300'
              }`}
              aria-pressed={roundOff}
              title={roundOff ? 'Round Off: ON' : 'Round Off: OFF'}
            >
              <span
                className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                  roundOff ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
              <span className={`absolute text-[8px] font-bold ${
                roundOff ? 'left-1.5 text-white' : 'right-1 text-gray-500'
              }`}>
                {roundOff ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
          <div className="hidden md:block" />
          <div className="hidden md:block" />

          <div className="flex justify-end">
            <button
              onClick={handleCalculate}
              className="px-8 py-2 bg-[#2D336B] hover:bg-[#1e2550] text-white font-bold rounded text-xs tracking-wide shadow-md transition active:scale-95"
            >
              Calculate
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Cards (shown after calculation) ──────────────────────── */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'EMI Per Period', value: fmt(result.rows[0]?.emi ?? 0) },
            { label: 'Total Principal', value: fmt(result.totalPrincipal) },
            { label: 'Total Interest', value: fmt(result.totalInterest) },
            { label: 'Total Payment', value: fmt(result.totalPrincipal + result.totalInterest) },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white border border-indigo-100 rounded-lg px-4 py-3 shadow-sm flex flex-col items-center"
            >
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</span>
              <span className="text-base font-extrabold text-[#3B3C6E]">₹ {value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── EMI Table ─────────────────────────────────────────────────────── */}
      {result && (
        <>
          <div className="bg-[#3B3C6E] text-white px-4 py-2 rounded-t-lg font-semibold text-xs uppercase tracking-widest shadow-sm">
            EMI Details
          </div>

          <div className="bg-white border-x border-b border-gray-200 rounded-b-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#3B3C6E] text-white">
                    {['S.no.', 'EMI', 'Amount', 'Interest', 'Balance'].map((h, i) => (
                      <th
                        key={h}
                        className={`py-3 px-4 font-semibold ${i === 0 ? 'w-20 text-center' : 'text-right'} ${i < 4 ? 'border-r border-indigo-900/40' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, idx) => (
                    <tr
                      key={row.sno}
                      className={
                        idx % 2 === 0
                          ? 'bg-white hover:bg-slate-50 transition'
                          : 'bg-[#e0f7f7] hover:bg-[#ccf1f1] transition'
                      }
                    >
                      <td className="py-2.5 px-4 text-center font-semibold text-gray-600 border-r border-gray-100">
                        {row.sno}
                      </td>
                      <td className="py-2.5 px-4 text-right text-gray-800 border-r border-gray-100">
                        {fmt(row.emi)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-gray-700 border-r border-gray-100">
                        {fmt(row.amount)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-gray-700 border-r border-gray-100">
                        {fmt(row.interest)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-gray-700">
                        {fmt(row.balance)}
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  <tr className="bg-[#3B3C6E]/10 border-t-2 border-[#3B3C6E]/30">
                    <td className="py-3 px-4 text-center font-bold text-gray-800 border-r border-gray-200">
                      &gt;
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 border-r border-gray-200">
                      {fmt(result.totalPrincipal + result.totalInterest)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 border-r border-gray-200">
                      {fmt(result.totalPrincipal)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 border-r border-gray-200">
                      {fmt(result.totalInterest)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!result && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Calculator className="w-14 h-14 mb-3 opacity-20" />
          <p className="text-sm font-medium">Fill in the details above and click <span className="font-bold text-[#3B3C6E]">Calculate</span></p>
        </div>
      )}
    </div>
  );
};

export default LoanCalculator;
