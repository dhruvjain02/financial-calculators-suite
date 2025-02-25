"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  fdCorpus: string;             // FD Corpus (INR)
  annualWithdrawal: string;     // Annual Withdrawal (INR)
  fdInterestRate: string;       // FD Interest Rate (% p.a.)
  inflationRate: string;        // Inflation Rate (% p.a.)
  taxRate?: string;             // Optional: Tax Rate on Interest (% p.a.)
  lifestyleAdjustment?: string; // Optional: Annual lifestyle adjustment (% p.a.)
  currentAge: string;           // Current Age
  retirementAge: string;        // Retirement Age
  lifeExpectancy: string;       // Life Expectancy
}

interface YearlyData {
  year: number;
  startingCorpus: number;
  interestEarned: number;
  taxPaid: number;
  netInterest: number;
  withdrawal: number;
  endingCorpus: number;
}

interface Results {
  yearsSustained: number;
  totalWithdrawals: number;
  totalInterestEarned: number;
  finalCorpus: number;
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
// Main FD-Based Retirement Calculator Component
// -----------------------
const FDBasedRetirementCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    fdCorpus: "",
    annualWithdrawal: "",
    fdInterestRate: "",
    inflationRate: "",
    taxRate: "",
    lifestyleAdjustment: "",
    currentAge: "",
    retirementAge: "",
    lifeExpectancy: "",
  });
  const [errors, setErrors] = useState<Partial<CalculatorInputs>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Validate inputs
  const validateInputs = (): boolean => {
    const newErrors: Partial<CalculatorInputs> = {};
    // Basic numeric validations for core fields
    const requiredFields = [
      "fdCorpus",
      "annualWithdrawal",
      "fdInterestRate",
      "inflationRate",
      "currentAge",
      "retirementAge",
      "lifeExpectancy",
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

  // Calculation Logic
  const calculateResults = () => {
    if (!validateInputs()) return;
    setIsCalculating(true);

    // Convert all needed inputs
    const FD = parseFloat(inputs.fdCorpus);
    const withdrawalBase = parseFloat(inputs.annualWithdrawal);
    const r = parseFloat(inputs.fdInterestRate) / 100;
    const inflation = parseFloat(inputs.inflationRate) / 100;
    const taxRate = inputs.taxRate ? parseFloat(inputs.taxRate) / 100 : 0;
    const lifestyle = inputs.lifestyleAdjustment
      ? parseFloat(inputs.lifestyleAdjustment) / 100
      : 0;
    const currentAge = parseFloat(inputs.currentAge);
    const retirementAge = parseFloat(inputs.retirementAge);
    const lifeExp = parseFloat(inputs.lifeExpectancy);
    // Maximum simulation years = life expectancy - retirement age
    const maxYears = lifeExp - retirementAge;

    let year = 0;
    let corpus = FD;
    let totalWithdrawals = 0;
    let totalInterestEarned = 0;
    const yearWise: YearlyData[] = [];

    // Simulate until the corpus depletes or we reach the maximum number of years
    while (corpus > 0 && year < maxYears) {
      year++;
      const startingCorpus = corpus;
      const interestEarned = startingCorpus * r;
      const taxPaid = interestEarned * taxRate;
      const netInterest = interestEarned - taxPaid;
      totalInterestEarned += netInterest;

      // Adjust annual withdrawal for inflation and lifestyle changes
      const withdrawal =
        withdrawalBase *
        Math.pow(1 + inflation, year - 1) *
        Math.pow(1 + lifestyle, year - 1);

      totalWithdrawals += withdrawal;
      corpus = startingCorpus + netInterest - withdrawal;

      yearWise.push({
        year,
        startingCorpus: parseFloat(startingCorpus.toFixed(2)),
        interestEarned: parseFloat(interestEarned.toFixed(2)),
        taxPaid: parseFloat(taxPaid.toFixed(2)),
        netInterest: parseFloat(netInterest.toFixed(2)),
        withdrawal: parseFloat(withdrawal.toFixed(2)),
        endingCorpus: parseFloat(corpus.toFixed(2)),
      });

      if (corpus <= 0) break;
    }

    setResults({
      yearsSustained: year,
      totalWithdrawals,
      totalInterestEarned,
      finalCorpus: corpus,
      yearWise,
    });
    setTimeout(() => setIsCalculating(false), 1000);
  };

  // Parse retirement age once for use in chart mapping and table
  const retirementAgeNum = parseFloat(inputs.retirementAge);

  // Prepare chart data for line and bar charts
  // The x-axis now shows the actual age (retirementAge + year - 1)
  const lineChartData =
    results &&
    results.yearWise.map((data) => ({
      age: retirementAgeNum + data.year - 1,
      "Remaining Corpus": data.endingCorpus,
    }));

  const barChartData =
    results &&
    results.yearWise.map((data) => ({
      age: retirementAgeNum + data.year - 1,
      Withdrawal: data.withdrawal,
      "Net Interest": data.netInterest,
    }));

  // Construct final recommendation based on new inputs
  let recommendation = "";
  if (results) {
    const { yearsSustained, finalCorpus } = results;
    const depletionAge = retirementAgeNum + yearsSustained;
    if (finalCorpus > 0) {
      recommendation = `Your FD corpus appears sustainable for ${yearsSustained} year(s) after retirement (i.e., until about age ${depletionAge}).`;
    } else {
      recommendation = `Your FD corpus is projected to deplete after ${yearsSustained} year(s) in retirement (i.e., around age ${depletionAge}). Consider adjusting your withdrawals or increasing your corpus.`;
    }
    if (depletionAge < parseFloat(inputs.lifeExpectancy)) {
      recommendation += ` However, your life expectancy is ${inputs.lifeExpectancy}, so you may face a shortfall.`;
    } else {
      recommendation += ` This meets or exceeds your life expectancy of ${inputs.lifeExpectancy}.`;
    }
    if (parseFloat(inputs.currentAge) < retirementAgeNum) {
      const yearsUntilRetire = retirementAgeNum - parseFloat(inputs.currentAge);
      recommendation += ` You are currently ${inputs.currentAge} and plan to retire at ${retirementAgeNum} (in ${yearsUntilRetire} year(s)).`;
    } else {
      recommendation += ` You are already at or past your planned retirement age (${retirementAgeNum}).`;
    }
  }

  return (
    <div className="container">
      {/* Back to Dashboard Button at Top */}
      <div className="top-nav">
        <Link href="/">
          <button className="back-button">Back to Dashboard</button>
        </Link>
      </div>

      <h1 className="title">Can I retire solely on my FD corpus?</h1>
      <p className="description">
        Assess whether relying on your Fixed Deposit corpus can sustainably fund your retirement withdrawals.
      </p>

      <div className="form-container">
        <h2 className="section-title">Retirement Investment Details</h2>
        <div className="input-group">
          {/* Current Age */}
          <label>
            <span className="input-label">
              Current Age
              <TooltipIcon text="Enter your current age in years." />
            </span>
            <input
              type="number"
              name="currentAge"
              value={inputs.currentAge}
              onChange={handleInputChange}
              placeholder="e.g., 30"
            />
            {errors.currentAge && <span className="error">{errors.currentAge}</span>}
          </label>
          {/* Retirement Age */}
          <label>
            <span className="input-label">
              Retirement Age
              <TooltipIcon text="Enter the age at which you plan to retire and start using your FD corpus." />
            </span>
            <input
              type="number"
              name="retirementAge"
              value={inputs.retirementAge}
              onChange={handleInputChange}
              placeholder="e.g., 60"
            />
            {errors.retirementAge && <span className="error">{errors.retirementAge}</span>}
          </label>
          {/* Life Expectancy */}
          <label>
            <span className="input-label">
              Life Expectancy
              <TooltipIcon text="Enter your estimated life expectancy in years." />
            </span>
            <input
              type="number"
              name="lifeExpectancy"
              value={inputs.lifeExpectancy}
              onChange={handleInputChange}
              placeholder="e.g., 85"
            />
            {errors.lifeExpectancy && <span className="error">{errors.lifeExpectancy}</span>}
          </label>
          {/* FD Corpus */}
          <label>
            <span className="input-label">
              FD Corpus (INR)
              <TooltipIcon text="Enter your total fixed deposit corpus available at retirement." />
            </span>
            <input
              type="number"
              name="fdCorpus"
              value={inputs.fdCorpus}
              onChange={handleInputChange}
              placeholder="e.g., 10000000"
            />
            <span className="converter">
              {inputs.fdCorpus && numberToWords(parseFloat(inputs.fdCorpus))} Rupees
            </span>
            {errors.fdCorpus && <span className="error">{errors.fdCorpus}</span>}
          </label>
          {/* Annual Withdrawal */}
          <label>
            <span className="input-label">
              Annual Withdrawal (INR)
              <TooltipIcon text="Enter the annual amount you plan to withdraw for living expenses." />
            </span>
            <input
              type="number"
              name="annualWithdrawal"
              value={inputs.annualWithdrawal}
              onChange={handleInputChange}
              placeholder="e.g., 600000"
            />
            <span className="converter">
              {inputs.annualWithdrawal && numberToWords(parseFloat(inputs.annualWithdrawal))} Rupees
            </span>
            {errors.annualWithdrawal && <span className="error">{errors.annualWithdrawal}</span>}
          </label>
          {/* FD Interest Rate */}
          <label>
            <span className="input-label">
              FD Interest Rate (% p.a.)
              <TooltipIcon text="Enter the annual interest rate offered on your FD." />
            </span>
            <input
              type="number"
              name="fdInterestRate"
              value={inputs.fdInterestRate}
              onChange={handleInputChange}
              placeholder="e.g., 6.5"
            />
            <span className="converter">
              {inputs.fdInterestRate && numberToWordsPercent(parseFloat(inputs.fdInterestRate))}
            </span>
            {errors.fdInterestRate && <span className="error">{errors.fdInterestRate}</span>}
          </label>
          {/* Inflation Rate */}
          <label>
            <span className="input-label">
              Inflation Rate (% p.a.)
              <TooltipIcon text="Enter the expected annual inflation rate affecting your withdrawals." />
            </span>
            <input
              type="number"
              name="inflationRate"
              value={inputs.inflationRate}
              onChange={handleInputChange}
              placeholder="e.g., 4"
            />
            <span className="converter">
              {inputs.inflationRate && numberToWordsPercent(parseFloat(inputs.inflationRate))}
            </span>
            {errors.inflationRate && <span className="error">{errors.inflationRate}</span>}
          </label>
          {/* Tax Rate */}
          <label>
            <span className="input-label">
              Tax Rate on Interest (% p.a.) (Optional)
              <TooltipIcon text="Enter the tax rate on your FD interest income if applicable." />
            </span>
            <input
              type="number"
              name="taxRate"
              value={inputs.taxRate || ""}
              onChange={handleInputChange}
              placeholder="e.g., 10"
            />
            <span className="converter">
              {inputs.taxRate && numberToWordsPercent(parseFloat(inputs.taxRate))}
            </span>
          </label>
          {/* Lifestyle Adjustment */}
          <label>
            <span className="input-label">
              Lifestyle Adjustment (% p.a.) (Optional)
              <TooltipIcon text="Enter any annual adjustment in your withdrawal due to lifestyle changes." />
            </span>
            <input
              type="number"
              name="lifestyleAdjustment"
              value={inputs.lifestyleAdjustment || ""}
              onChange={handleInputChange}
              placeholder="e.g., 2"
            />
            <span className="converter">
              {inputs.lifestyleAdjustment &&
                numberToWordsPercent(parseFloat(inputs.lifestyleAdjustment))}
            </span>
          </label>
        </div>
        <button className="calculate-button" onClick={calculateResults} disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {results && (
        <div className="results-container">
          <h2 className="results-title">Retirement Sustainability Summary</h2>
          <div className="summary-card">
            <div className="summary-item">
              <strong>Years Sustained:</strong> {results.yearsSustained}{" "}
              {results.yearsSustained > 0 && `(${numberToWords(results.yearsSustained)} years)`}
            </div>
            <div className="summary-item">
              <strong>Total Withdrawals Made:</strong> ₹
              {results.totalWithdrawals.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.totalWithdrawals))} Rupees)
            </div>
            <div className="summary-item">
              <strong>Total Interest Earned:</strong> ₹
              {results.totalInterestEarned.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.totalInterestEarned))} Rupees)
            </div>
            <div className="summary-item">
              <strong>Final Corpus Balance:</strong> ₹
              {results.finalCorpus.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.finalCorpus))} Rupees)
            </div>
            <div className="summary-item">
              <strong>Recommendation:</strong> 
              <br />
              <span>{recommendation}</span>
            </div>
          </div>

          <h2 className="results-title">Corpus Projection Over Time</h2>
          <div className="chart-explanation">
            <p>
              The charts below show how your FD corpus changes each year as you withdraw funds and earn interest.
              <br />Hover over the graphs for detailed values.
            </p>
            {chartType === "line" && (
              <p>
                <strong>Line Chart:</strong> Displays the remaining corpus balance by age.
              </p>
            )}
            {chartType === "bar" && (
              <p>
                <strong>Bar Chart:</strong> Illustrates annual withdrawals and net interest effects by age.
              </p>
            )}
          </div>
          <div className="chart-toggle">
            <button onClick={() => setChartType("line")} className={chartType === "line" ? "active" : ""}>
              Line Chart
            </button>
            <button onClick={() => setChartType("bar")} className={chartType === "bar" ? "active" : ""}>
              Bar Chart
            </button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="90%" height={300}>
              {chartType === "line" && lineChartData ? (
                <LineChart data={lineChartData} margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" label={{ value: "Age", position: "insideBottom", offset: -5 }} />
                  <YAxis domain={["auto", "auto"]} tickFormatter={(val) => "₹" + val.toLocaleString("en-IN")} />
                  <RechartsTooltip formatter={(value: number) => "₹" + Math.round(value).toLocaleString("en-IN")} />
                  <Legend />
                  <Line type="monotone" dataKey="Remaining Corpus" stroke="#1B1F13" strokeWidth={2} name="Remaining Corpus" />
                </LineChart>
              ) : chartType === "bar" && barChartData ? (
                <BarChart data={barChartData} margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" label={{ value: "Age", position: "insideBottom", offset: -5 }} />
                  <YAxis tickFormatter={(val) => "₹" + val.toLocaleString("en-IN")} />
                  <RechartsTooltip formatter={(value: number) => "₹" + Math.round(value).toLocaleString("en-IN")} />
                  <Legend />
                  <Bar dataKey="Withdrawal" fill="#CAEF7D" name="Annual Withdrawal" />
                  <Bar dataKey="Net Interest" fill="#1B1F13" name="Net Interest" />
                </BarChart>
              ) : (
                <React.Fragment />
              )}
            </ResponsiveContainer>
          </div>

          {/* Table below the chart */}
          <div className="amortization-table">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Age</th>
                  <th>Starting Corpus (₹)</th>
                  <th>Interest Earned (₹)</th>
                  <th>Tax Paid (₹)</th>
                  <th>Net Interest (₹)</th>
                  <th>Withdrawal (₹)</th>
                  <th>Ending Corpus (₹)</th>
                </tr>
              </thead>
              <tbody>
                {results.yearWise.map((data) => (
                  <tr key={data.year}>
                    <td>{data.year}</td>
                    <td>{retirementAgeNum + data.year - 1}</td>
                    <td>{data.startingCorpus.toLocaleString("en-IN")}</td>
                    <td>{data.interestEarned.toLocaleString("en-IN")}</td>
                    <td>{data.taxPaid.toLocaleString("en-IN")}</td>
                    <td>{data.netInterest.toLocaleString("en-IN")}</td>
                    <td>{data.withdrawal.toLocaleString("en-IN")}</td>
                    <td>{data.endingCorpus.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results && (
        <div className="disclaimer">
          <h4>Important Considerations</h4>
          <ul>
            <li>
              This calculator estimates how long your FD corpus can support your retirement withdrawals.
            </li>
            <li>
              Calculations account for interest earned (net of tax, if provided) and withdrawals adjusted for inflation and lifestyle changes.
            </li>
            <li>
              It assumes you already have your FD corpus at retirement (i.e. it does not accumulate your corpus from your current age to retirement).
            </li>
            <li>
              The projection is capped at your life expectancy; the graph and recommendations only show years up to (life expectancy – retirement age).
            </li>
            <li>
              Please consult a financial advisor before making any major retirement decisions.
            </li>
          </ul>
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

export default FDBasedRetirementCalculator;
