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

// For this Endowment Calculator, we use these inputs:
interface CalculatorInputs {
  surrenderValue: string;   // Current Surrender Value (INR)
  maturityValue: string;    // Guaranteed Maturity Value (INR)
  remainingTenure: string;  // Remaining Tenure (Years)
  altReturn: string;        // Expected Alternative Investment Return (%)
}

// Yearly breakdown for projections
interface YearlyData {
  year: number;
  endowmentValue: number;  // Projected policy value at that year (linear interpolation)
  altCorpus: number;       // Future value if surrender value is invested
}

// Results interface for Endowment Calculator
interface Results {
  finalAltCorpus: number;    // Final value if surrender value is invested over the remaining tenure
  finalPolicyValue: number;  // Guaranteed maturity value of the policy (MV)
  bestOption: string;        // Recommendation for the user
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
          Endowment Policy: ₹{payload[0]?.value?.toLocaleString("en-IN")}
        </p>
        <p className="intro">
          Alternative Investment: ₹{payload[1]?.value?.toLocaleString("en-IN")}
        </p>
        <p className="desc">
          This chart compares the growth of your policy value versus investing your surrender value.
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
          Difference: ₹{payload[0]?.value?.toLocaleString("en-IN")}
        </p>
        <p className="desc">
          The shaded area shows the extra return you could get by investing the surrender value.
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
// Main Endowment Calculator Component
// -----------------------
const EndowmentCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    surrenderValue: "",
    maturityValue: "",
    remainingTenure: "",
    altReturn: "",
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

  // Validate inputs
  const validateInputs = (): boolean => {
    const newErrors: Partial<CalculatorInputs> = {};
    const requiredFields = ["surrenderValue", "maturityValue", "remainingTenure", "altReturn"];
    requiredFields.forEach((field) => {
      const value = inputs[field as keyof CalculatorInputs];
      if (!value || isNaN(Number(value)) || Number(value) < 0) {
        newErrors[field as keyof CalculatorInputs] = "Please enter a valid number";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculation Logic
  const calculateResults = () => {
    if (!validateInputs()) return;
    setIsCalculating(true);

    const SV = parseFloat(inputs.surrenderValue);  // Surrender Value
    const MV = parseFloat(inputs.maturityValue);     // Maturity Value
    const n = parseFloat(inputs.remainingTenure);      // Remaining Tenure (years)
    const r = parseFloat(inputs.altReturn) / 100;      // Expected alternative return

    // Alternative Investment Future Value using compound interest
    const altFV = SV * Math.pow(1 + r, n);

    // For the policy, we assume a linear progression from surrender value to maturity value over n years.
    const yearWise: YearlyData[] = [];
    for (let i = 0; i <= n; i++) {
      const endowmentValue = SV + ((MV - SV) / n) * i;
      const altCorpus = SV * Math.pow(1 + r, i);
      yearWise.push({
        year: i,
        endowmentValue: parseFloat(endowmentValue.toFixed(2)),
        altCorpus: parseFloat(altCorpus.toFixed(2)),
      });
    }

    // Final values at maturity (year = n)
    const finalPolicyValue = MV;
    const finalAltCorpus = altFV;

    // Determine recommendation
    let bestOption = "";
    if (finalAltCorpus > finalPolicyValue) {
      bestOption = "Surrendering the policy and investing the amount is beneficial";
    } else if (finalAltCorpus < finalPolicyValue) {
      bestOption = "Continuing the policy is financially better";
    } else {
      bestOption = "Both options yield nearly equal returns";
    }

    setResults({
      finalAltCorpus,
      finalPolicyValue,
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
      "Endowment Policy": data.endowmentValue,
      "Alternative Investment": data.altCorpus,
    }));

  const areaChartData =
    results &&
    results.yearWise.map((data) => ({
      year: data.year,
      Difference: data.altCorpus - data.endowmentValue,
    }));

  return (
    <div className="container">
      {/* Back to Dashboard Button at Top */}
      <div className="top-nav">
        <Link href="/">
          <button className="back-button">Back to Dashboard</button>
        </Link>
      </div>

      <h1 className="title">Endowment Insurance Calculator</h1>
      <p className="description">
        Determine whether to continue your endowment policy or surrender it and invest the amount.
      </p>
      {/* Explanation Section */}
      <div className="explanation">
        <p>
          <strong>Endowment Policy:</strong> A life insurance product that guarantees a lump sum payout (maturity value) at the end of the policy term. Continuing the policy means you receive the maturity benefit.
        </p>
        <p>
          <strong>Surrender Value:</strong> The amount you receive if you cancel your policy today. If you invest this amount in an alternative investment, it can grow at a compound rate.
        </p>
      </div>

      <div className="form-container">
        <h2 className="section-title">Policy & Investment Details</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Current Surrender Value (INR)
              <TooltipIcon text="Enter the amount you would receive if you surrender your policy today." />
            </span>
            <input
              type="number"
              name="surrenderValue"
              value={inputs.surrenderValue}
              onChange={handleInputChange}
              placeholder="e.g., 500000"
            />
            <span className="converter">
              {inputs.surrenderValue && numberToWords(parseFloat(inputs.surrenderValue))} Rupees
            </span>
            {errors.surrenderValue && <span className="error">{errors.surrenderValue}</span>}
          </label>
          <label>
            <span className="input-label">
              Maturity Value (INR)
              <TooltipIcon text="Enter the guaranteed payout at the end of your policy term." />
            </span>
            <input
              type="number"
              name="maturityValue"
              value={inputs.maturityValue}
              onChange={handleInputChange}
              placeholder="e.g., 1200000"
            />
            <span className="converter">
              {inputs.maturityValue && numberToWords(parseFloat(inputs.maturityValue))} Rupees
            </span>
            {errors.maturityValue && <span className="error">{errors.maturityValue}</span>}
          </label>
          <label>
            <span className="input-label">
              Remaining Tenure (Years)
              <TooltipIcon text="Enter the number of years left until the policy matures." />
            </span>
            <input
              type="number"
              name="remainingTenure"
              value={inputs.remainingTenure}
              onChange={handleInputChange}
              placeholder="e.g., 10"
            />
            <span className="converter">
              {inputs.remainingTenure && numberToWords(parseFloat(inputs.remainingTenure))} Years
            </span>
            {errors.remainingTenure && <span className="error">{errors.remainingTenure}</span>}
          </label>
          <label>
            <span className="input-label">
              Expected Alternative Return (%)
              <TooltipIcon text="Enter the annual return rate you expect if you invest the surrender value." />
            </span>
            <input
              type="number"
              name="altReturn"
              value={inputs.altReturn}
              onChange={handleInputChange}
              placeholder="e.g., 12"
            />
            <span className="converter">
              {inputs.altReturn && numberToWordsPercent(parseFloat(inputs.altReturn))}
            </span>
            {errors.altReturn && <span className="error">{errors.altReturn}</span>}
          </label>
        </div>
        <button className="calculate-button" onClick={calculateResults} disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {results && (
        <div className="results-container">
          <h2 className="results-title">Comparison Summary</h2>
          <div className="summary-card">
            <div className="summary-item">
              <strong>Policy Maturity Value:</strong> ₹
              {results.finalPolicyValue.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.finalPolicyValue))} Rupees)
            </div>
            <div className="summary-item">
              <strong>Alternative Investment Corpus:</strong> ₹
              {results.finalAltCorpus.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.finalAltCorpus))} Rupees)
            </div>
            <div className="summary-item">
              <strong>Recommendation:</strong> {results.bestOption}
            </div>
          </div>

          <h2 className="results-title">Cumulative Value Projection</h2>
          <div className="chart-explanation">
            <p>
              The charts below display the projected growth of your endowment policy value versus the value if you invest your surrender value at the expected return rate. Hover over the graphs for detailed values.
            </p>
            {chartType === "line" && (
              <p>
                <strong>Line Chart:</strong> A smooth trend line showing cumulative values.
              </p>
            )}
            {chartType === "area" && (
              <p>
                <strong>Area Chart:</strong> The shaded area represents the difference between the two options.
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
                  <Line type="monotone" dataKey="Endowment Policy" stroke="#1B1F13" strokeWidth={2} name="Policy Value" />
                  <Line type="monotone" dataKey="Alternative Investment" stroke="#CAEF7D" strokeWidth={2} name="Investment Value" />
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

          <h2 className="results-title">Year-wise Projection</h2>
          <div className="amortization-table">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Policy Value (INR)</th>
                  <th>Investment Value (INR)</th>
                </tr>
              </thead>
              <tbody>
                {results.yearWise.map((data) => (
                  <tr key={data.year}>
                    <td>{data.year}</td>
                    <td>{data.endowmentValue.toLocaleString("en-IN")}</td>
                    <td>{data.altCorpus.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="disclaimer">
            <h4>Important Considerations</h4>
            <ul>
              <li>
                This calculator compares the guaranteed maturity value of your endowment policy with the potential returns from investing the surrender value.
              </li>
              <li>
                The policy value is approximated using a linear interpolation between the current surrender value and the maturity value.
              </li>
              <li>
                Actual returns can vary due to market conditions, fees, and other factors.
              </li>
            </ul>
            <p>Please consult with a financial advisor before making any major decisions.</p>
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

export default EndowmentCalculator;
