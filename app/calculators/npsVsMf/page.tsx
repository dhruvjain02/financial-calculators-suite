"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// -----------------------
// Interfaces
// -----------------------
interface CalculatorInputs {
  monthlyInvestment: string;         // Fixed monthly investment (INR)
  investmentTenure: string;          // Investment Tenure (Years)
  mfReturn: string;                  // Expected annual return for Mutual Funds (%)
  npsReturn: string;                 // Expected annual return for NPS (%)
  taxSlab: string;                   // Income Tax Slab (%) for tax benefit calculation
  npsEquityAllocation?: string;      // Optional: NPS Equity Allocation (%)
  postRetWithdrawal?: string;        // Optional: Post-Retirement NPS Withdrawal (%)
}

interface YearlyData {
  year: number;
  mfCorpus: number;
  npsCorpus: number;
}

interface Results {
  finalMFCorpus: number;
  finalNPSCorpus: number;
  taxBenefit: number;
  bestOption: string;
  yearWise: YearlyData[];
}

// -----------------------
// Utility: Tooltip Component for Inputs
// -----------------------
const TooltipIcon: React.FC<{ text: string }> = ({ text }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <span
      className="tooltipIcon"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="info-icon">i</span>
      {isHovered && <span className="tooltiptext">{text}</span>}
      <style jsx>{`
        .tooltipIcon {
          position: relative;
          display: inline-block;
          margin-left: 5px;
          cursor: pointer;
          vertical-align: middle;
        }
        .info-icon {
          display: inline-block;
          background: #caef7d;
          color: #1b1f13;
          border-radius: 50%;
          font-size: 0.6rem;
          width: 14px;
          height: 14px;
          text-align: center;
          line-height: 14px;
          font-weight: bold;
        }
        .tooltiptext {
          visibility: visible;
          width: 220px;
          background-color: #caef7d;
          color: #1b1f13;
          text-align: left;
          border-radius: 4px;
          padding: 6px 8px;
          position: absolute;
          z-index: 1000;
          bottom: 130%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.75rem;
          line-height: 1.2;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          opacity: 1;
        }
        .tooltiptext::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -4px;
          border-width: 4px;
          border-style: solid;
          border-color: #caef7d transparent transparent transparent;
        }
      `}</style>
    </span>
  );
};

// -----------------------
// Utility: Number to Words Converters
// -----------------------
const numberToWords = (num: number): string => {
  if (num === undefined || num === null) return "";
  num = Math.abs(Math.round(num));
  if (num === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "Ten",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  if (num < 20) return ones[num];
  if (num < 100)
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
  if (num < 1000)
    return (
      ones[Math.floor(num / 100)] +
      " Hundred" +
      (num % 100 !== 0 ? " " + numberToWords(num % 100) : "")
    );
  if (num < 100000)
    return (
      numberToWords(Math.floor(num / 1000)) +
      " Thousand" +
      (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "")
    );
  if (num < 10000000)
    return (
      numberToWords(Math.floor(num / 100000)) +
      " Lakh" +
      (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "")
    );
  return (
    numberToWords(Math.floor(num / 10000000)) +
    " Crore" +
    (num % 10000000 !== 0 ? " " + numberToWords(num % 10000000) : "")
  );
};

const numberToWordsPercent = (value: number): string => {
  if (value === undefined || value === null) return "";
  if (Number.isInteger(value)) return numberToWords(value) + " percent";
  const intPart = Math.floor(value);
  const decimalPart = Math.round((value - intPart) * 10);
  return `${numberToWords(intPart)} point ${numberToWords(decimalPart)} percent`;
};

// -----------------------
// Custom Tooltip for Line Chart
// -----------------------
const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">Year: {label}</p>
        <p className="intro">
          Mutual Fund: ₹{payload[0]?.value?.toLocaleString("en-IN")}
        </p>
        <p className="intro">
          NPS (incl. Tax Benefit): ₹{payload[1]?.value?.toLocaleString("en-IN")}
        </p>
        <p className="desc">
          This chart shows your cumulative corpus growth for both options.
        </p>
        <style jsx>{`
          .custom-tooltip {
            background: #ffffff;
            border: 1px solid #ccc;
            padding: 8px;
            border-radius: 4px;
          }
          .label {
            font-weight: bold;
            margin-bottom: 4px;
          }
          .intro {
            margin: 0;
          }
          .desc {
            font-size: 0.8rem;
            color: #555;
            margin-top: 4px;
          }
        `}</style>
      </div>
    );
  }
  return null;
};

// -----------------------
// Custom Tooltip for Area Chart
// -----------------------
const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">Year: {label}</p>
        <p className="intro">
          Corpus Difference: ₹{payload[0]?.value?.toLocaleString("en-IN")}
        </p>
        <p className="desc">
          The shaded area shows the extra value in NPS (with tax benefit) compared to Mutual Fund.
        </p>
        <style jsx>{`
          .custom-tooltip {
            background: #ffffff;
            border: 1px solid #ccc;
            padding: 8px;
            border-radius: 4px;
          }
          .label {
            font-weight: bold;
            margin-bottom: 4px;
          }
          .intro {
            margin: 0;
          }
          .desc {
            font-size: 0.8rem;
            color: #555;
            margin-top: 4px;
          }
        `}</style>
      </div>
    );
  }
  return null;
};

// -----------------------
// Main Mutual Fund vs. NPS Calculator Component
// -----------------------
const MutualFundvsNPSTierICalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    monthlyInvestment: "",
    investmentTenure: "",
    mfReturn: "",
    npsReturn: "",
    taxSlab: "",
    npsEquityAllocation: "",
    postRetWithdrawal: "",
  });
  const [errors, setErrors] = useState<Partial<CalculatorInputs>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [chartType, setChartType] = useState<"line" | "area">("line");

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Validate required inputs
  const validateInputs = (): boolean => {
    const newErrors: Partial<CalculatorInputs> = {};
    const requiredFields = [
      "monthlyInvestment",
      "investmentTenure",
      "mfReturn",
      "npsReturn",
      "taxSlab",
    ];
    requiredFields.forEach((field) => {
      const value = inputs[field as keyof CalculatorInputs];
      if (!value || isNaN(Number(value)) || Number(value) < 0) {
        newErrors[field as keyof CalculatorInputs] = "Please enter a valid number";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculation Logic using SIP formula and adding tax benefit for NPS
  const calculateResults = () => {
    if (!validateInputs()) return;
    setIsCalculating(true);

    const P = parseFloat(inputs.monthlyInvestment);
    const t = parseFloat(inputs.investmentTenure);
    const rMF = parseFloat(inputs.mfReturn) / 100;
    const rNPS = parseFloat(inputs.npsReturn) / 100;
    const taxRate = parseFloat(inputs.taxSlab) / 100;

    // SIP formula: FV = P * ((1 + r/12)^(12*t) - 1) / (r/12) * (1 + r/12)
    const mfFV =
      P *
      ((Math.pow(1 + rMF / 12, 12 * t) - 1) / (rMF / 12)) *
      (1 + rMF / 12);

    const npsFV =
      P *
      ((Math.pow(1 + rNPS / 12, 12 * t) - 1) / (rNPS / 12)) *
      (1 + rNPS / 12);

    // Tax benefit: Total annual contributions * tax rate
    const totalContribution = P * 12 * t;
    const taxBenefit = totalContribution * taxRate;

    // Effective NPS corpus includes tax savings
    const effectiveNpsFV = npsFV + taxBenefit;

    // Determine which option is better
    let bestOption = "";
    if (mfFV > effectiveNpsFV) {
      bestOption = "Mutual Fund SIP provides higher returns";
    } else if (mfFV < effectiveNpsFV) {
      bestOption = "NPS Tier I (with tax benefits) is a better option";
    } else {
      bestOption = "Both options yield nearly equal returns";
    }

    // Prepare year-wise breakdown for charting
    const yearWise: YearlyData[] = [];
    for (let i = 1; i <= t; i++) {
      const mfYearFV =
        P *
        ((Math.pow(1 + rMF / 12, 12 * i) - 1) / (rMF / 12)) *
        (1 + rMF / 12);
      const npsYearFV =
        P *
        ((Math.pow(1 + rNPS / 12, 12 * i) - 1) / (rNPS / 12)) *
        (1 + rNPS / 12);
      const taxYearBenefit = P * 12 * i * taxRate;
      yearWise.push({
        year: i,
        mfCorpus: parseFloat(mfYearFV.toFixed(2)),
        npsCorpus: parseFloat((npsYearFV + taxYearBenefit).toFixed(2)),
      });
    }

    setResults({
      finalMFCorpus: mfFV,
      finalNPSCorpus: effectiveNpsFV,
      taxBenefit,
      bestOption,
      yearWise,
    });
    setTimeout(() => setIsCalculating(false), 1000);
  };

  // Prepare chart data for line and area charts
  const lineChartData =
    results &&
    results.yearWise.map((data) => ({
      year: data.year,
      "Mutual Fund": data.mfCorpus,
      "NPS (incl. Tax Benefit)": data.npsCorpus,
    }));

  const areaChartData =
    results &&
    results.yearWise.map((data) => ({
      year: data.year,
      Difference: data.npsCorpus - data.mfCorpus,
    }));

  return (
    <div className="container">
      {/* Back to Dashboard Button at Top */}
      <div className="top-nav">
        <Link href="/">
          <button className="back-button">Back to Dashboard</button>
        </Link>
      </div>

      <h1 className="title">Mutual Fund vs. NPS Tier I Calculator</h1>
      <p className="description">
        Compare long-term returns between market-driven Mutual Funds and government-backed NPS Tier I investments.
      </p>
      {/* Simple Explanation Section */}
      <div className="explanation">
        <p>
          <strong>Mutual Funds:</strong> Investment vehicles that pool money from many investors to buy a diversified portfolio of stocks or bonds. They are managed by professionals and reflect market performance.
        </p>
        <p>
          <strong>NPS Tier I:</strong> A government-backed retirement scheme that offers tax benefits and a mix of equity and debt investments. It is designed for long-term savings with partial annuitization at retirement.
        </p>
      </div>

      <div className="form-container">
        <h2 className="section-title">Investment Details</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Monthly Investment (INR)
              <TooltipIcon text="Enter the fixed monthly amount you plan to invest." />
            </span>
            <input
              type="number"
              name="monthlyInvestment"
              value={inputs.monthlyInvestment}
              onChange={handleInputChange}
              placeholder="e.g., 10000"
            />
            <span className="converter">
              {inputs.monthlyInvestment && numberToWords(parseFloat(inputs.monthlyInvestment))} Rupees
            </span>
            {errors.monthlyInvestment && <span className="error">{errors.monthlyInvestment}</span>}
          </label>
          <label>
            <span className="input-label">
              Investment Tenure (Years)
              <TooltipIcon text="Enter the number of years for which you will invest." />
            </span>
            <input
              type="number"
              name="investmentTenure"
              value={inputs.investmentTenure}
              onChange={handleInputChange}
              placeholder="e.g., 20"
            />
            <span className="converter">
              {inputs.investmentTenure && numberToWords(parseFloat(inputs.investmentTenure))} Years
            </span>
            {errors.investmentTenure && <span className="error">{errors.investmentTenure}</span>}
          </label>
          <label>
            <span className="input-label">
              Expected Return (Mutual Fund) (%)
              <TooltipIcon text="Enter the annual return rate for Mutual Fund SIPs (typically 12-15%)." />
            </span>
            <input
              type="number"
              name="mfReturn"
              value={inputs.mfReturn}
              onChange={handleInputChange}
              placeholder="e.g., 12"
            />
            <span className="converter">
              {inputs.mfReturn && numberToWordsPercent(parseFloat(inputs.mfReturn))}
            </span>
            {errors.mfReturn && <span className="error">{errors.mfReturn}</span>}
          </label>
          <label>
            <span className="input-label">
              Expected Return (NPS) (%)
              <TooltipIcon text="Enter the annual return rate for NPS Tier I (typically 8-10%)." />
            </span>
            <input
              type="number"
              name="npsReturn"
              value={inputs.npsReturn}
              onChange={handleInputChange}
              placeholder="e.g., 9"
            />
            <span className="converter">
              {inputs.npsReturn && numberToWordsPercent(parseFloat(inputs.npsReturn))}
            </span>
            {errors.npsReturn && <span className="error">{errors.npsReturn}</span>}
          </label>
          <label>
            <span className="input-label">
              Tax Slab (%)
              <TooltipIcon text="Enter your income tax slab (e.g., 10, 20, or 30%). This will impact the tax savings on NPS." />
            </span>
            <input
              type="number"
              name="taxSlab"
              value={inputs.taxSlab}
              onChange={handleInputChange}
              placeholder="e.g., 20"
            />
            <span className="converter">
              {inputs.taxSlab && numberToWordsPercent(parseFloat(inputs.taxSlab))}
            </span>
            {errors.taxSlab && <span className="error">{errors.taxSlab}</span>}
          </label>
          {/* Optional Advanced Inputs */}
          <label>
            <span className="input-label">
              NPS Equity Allocation (%) (Optional)
              <TooltipIcon text="Enter the percentage of your NPS investment allocated to equity." />
            </span>
            <input
              type="number"
              name="npsEquityAllocation"
              value={inputs.npsEquityAllocation || ""}
              onChange={handleInputChange}
              placeholder="e.g., 50"
            />
            <span className="converter">
              {inputs.npsEquityAllocation && numberToWordsPercent(parseFloat(inputs.npsEquityAllocation))}
            </span>
          </label>
          <label>
            <span className="input-label">
              Post-Retirement NPS Withdrawal (%) (Optional)
              <TooltipIcon text="Enter the percentage of the NPS corpus you plan to withdraw at retirement." />
            </span>
            <input
              type="number"
              name="postRetWithdrawal"
              value={inputs.postRetWithdrawal || ""}
              onChange={handleInputChange}
              placeholder="e.g., 60"
            />
            <span className="converter">
              {inputs.postRetWithdrawal && numberToWordsPercent(parseFloat(inputs.postRetWithdrawal))}
            </span>
          </label>
        </div>
        <button className="calculate-button" onClick={calculateResults} disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {results && (
        <div className="results-container">
          <h2 className="results-title">Investment Comparison Summary</h2>
          <div className="summary-card">
            <div className="summary-item">
              <strong>Mutual Fund Corpus:</strong> ₹
              {results.finalMFCorpus.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.finalMFCorpus))} Rupees)
            </div>
            <div className="summary-item">
              <strong>NPS Corpus (incl. Tax Benefit):</strong> ₹
              {results.finalNPSCorpus.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.finalNPSCorpus))} Rupees)
            </div>
            <div className="summary-item">
              <strong>Total Tax Benefit:</strong> ₹
              {results.taxBenefit.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.taxBenefit))} Rupees)
            </div>
            <div className="summary-item">
              <strong>Recommendation:</strong> {results.bestOption}
            </div>
          </div>

          <h2 className="results-title">Cumulative Corpus Projection</h2>
          <div className="chart-explanation">
            <p>
              The charts below display the growth of your investments over the chosen tenure. The line chart shows a continuous trend of corpus growth for both Mutual Funds and NPS (including tax benefits), while the area chart highlights the difference between them.
              <br />Hover over the graphs for detailed values.
            </p>
            {chartType === "line" && (
              <p>
                <strong>Line Chart:</strong> A smooth trend line representing cumulative corpus.
              </p>
            )}
            {chartType === "area" && (
              <p>
                <strong>Area Chart:</strong> The shaded area represents the extra corpus in NPS due to tax benefits.
              </p>
            )}
          </div>
          <div className="chart-toggle">
            <button onClick={() => setChartType("line")} className={chartType === "line" ? "active" : ""}>
              Line Chart
            </button>
            <button onClick={() => setChartType("area")} className={chartType === "area" ? "active" : ""}>
              Area Chart
            </button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="90%" height={300}>
              {chartType === "line" && lineChartData ? (
                <LineChart data={lineChartData} margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                  <YAxis domain={["auto", "auto"]} tickFormatter={(val) => val.toLocaleString("en-IN")} />
                  <RechartsTooltip content={CustomLineTooltip} />
                  <Legend />
                  <Line type="monotone" dataKey="Mutual Fund" stroke="#1B1F13" strokeWidth={2} name="Mutual Fund SIP" />
                  <Line type="monotone" dataKey="NPS (incl. Tax Benefit)" stroke="#CAEF7D" strokeWidth={2} name="NPS Tier I" />
                </LineChart>
              ) : chartType === "area" && areaChartData ? (
                <AreaChart data={areaChartData} margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                  <YAxis domain={["auto", "auto"]} tickFormatter={(val) => val.toLocaleString("en-IN")} />
                  <RechartsTooltip content={CustomAreaTooltip} />
                  <Legend />
                  <Area type="monotone" dataKey="Difference" stroke="#1B1F13" fill="#1B1F13" name="Corpus Difference" />
                </AreaChart>
              ) : (
                <React.Fragment />
              )}
            </ResponsiveContainer>
          </div>

          <h2 className="results-title">Year-wise Breakdown</h2>
          <div className="amortization-table">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Mutual Fund Corpus (INR)</th>
                  <th>NPS Corpus (incl. Tax Benefit) (INR)</th>
                </tr>
              </thead>
              <tbody>
                {results.yearWise.map((data) => (
                  <tr key={data.year}>
                    <td>{data.year}</td>
                    <td>{data.mfCorpus.toLocaleString("en-IN")}</td>
                    <td>{data.npsCorpus.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="disclaimer">
            <h4>Important Considerations</h4>
            <ul>
              <li>
                This calculator projects your investment corpus over the chosen tenure based on the input parameters.
              </li>
              <li>
                Mutual Funds and NPS are compared using a SIP formula, with NPS including an estimated tax benefit.
              </li>
              <li>
                Actual returns can vary due to market conditions and other factors.
              </li>
            </ul>
            <p>Please consult with a financial advisor before making any investment decisions.</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .container {
          padding: 2rem;
          font-family: "Poppins", sans-serif;
          background: #fcffee;
          color: #1b1f13;
        }
        .top-nav {
          margin-bottom: 1rem;
        }
        .back-button {
          background: #000000;
          color: #fcffee;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-family: "Poppins", sans-serif;
          font-weight: 500;
        }
        .title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .description {
          text-align: center;
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }
        .explanation {
          background: #f0f8e8;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border-left: 4px solid #caef7d;
          font-size: 0.95rem;
        }
        .explanation p {
          margin: 0.5rem 0;
          line-height: 1.5;
        }
        .form-container {
          background: #fff;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }
        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1rem 0;
        }
        .input-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .input-group label {
          display: flex;
          flex-direction: column;
          font-size: 1rem;
          position: relative;
        }
        .input-label {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
        }
        .input-group input,
        .select-input {
          padding: 0.5rem;
          margin-top: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          height: 38px;
          width: 100%;
          box-sizing: border-box;
          font-size: 1rem;
        }
        .converter {
          font-size: 0.9rem;
          color: #777;
          margin-top: 0.25rem;
        }
        .error {
          color: red;
          font-size: 0.8rem;
        }
        .calculate-button {
          background: #caef7d;
          color: #1b1f13;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
          width: 100%;
        }
        .calculate-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .results-container {
          background: #fff;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }
        .results-title {
          font-size: 1.8rem;
          font-weight: 600;
          margin-bottom: 1rem;
          text-align: center;
        }
        .summary-card {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: grid;
          gap: 0.75rem;
        }
        .summary-item {
          font-size: 1rem;
          margin: 0.25rem 0;
        }
        .chart-explanation {
          background: #f0f8e8;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          border-left: 4px solid #caef7d;
          text-align: center;
          font-size: 0.95rem;
        }
        .chart-toggle {
          display: flex;
          justify-content: center;
          margin: 1rem 0;
          gap: 1rem;
        }
        .chart-toggle button {
          background: transparent;
          border: 1px solid #1b1f13;
          padding: 0.5rem 1rem;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        .chart-toggle button.active {
          background: #caef7d;
          color: #1b1f13;
          border-color: #caef7d;
        }
        .chart-container {
          margin: 1rem 0 2rem;
          display: flex;
          justify-content: center;
        }
        .amortization-table {
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 1.5rem;
          border-radius: 8px;
          border: 1px solid #eee;
        }
        .amortization-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .amortization-table th,
        .amortization-table td {
          border: 1px solid #eee;
          padding: 0.5rem;
          text-align: center;
        }
        .amortization-table th {
          background: #f0f8e8;
          position: sticky;
          top: 0;
        }
        .disclaimer {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 4px;
          font-size: 0.9rem;
          color: #555;
          border: 1px solid #ddd;
          margin-top: 2rem;
        }
        .disclaimer h4 {
          margin-top: 0;
          color: #1b1f13;
          margin-bottom: 0.5rem;
        }
        .disclaimer ul {
          margin: 0;
          padding-left: 1.5rem;
        }
        .disclaimer li {
          margin-bottom: 0.5rem;
        }
        @media (max-width: 768px) {
          .input-group {
            grid-template-columns: 1fr;
          }
          .chart-container {
            margin: 1.5rem 0;
          }
          .summary-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MutualFundvsNPSTierICalculator;
