"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Interfaces for inputs and results
interface CalculatorInputs {
  investmentMode: string;            // "Monthly" or "Yearly"
  investmentAmount: string;          // Periodic contribution (INR)
  investmentDuration: string;        // Duration of deposits (Years, max 15)
  currentInterestRate: string;       // SSY Interest Rate (%) compounded annually
  daughtersAge: string;              // Daughter's current age (Years)
  lumpSum: string;                   // Optional one-time deposit (INR)
  stepUp: string;                    // Optional step-up SIP (%) per year
}

interface YearlyData {
  year: number;
  totalInvested: number;
  futureValue: number;
  wealthGained: number;
}

interface Results {
  totalInvested: number;
  futureValue: number;
  wealthGained: number;
  yearWise: YearlyData[];
}

//
// Tooltip Component
// Displays an "i" icon that shows friendly info when hovered over.
//
const Tooltip: React.FC<{ text: string }> = ({ text }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <span 
      className="tooltip" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="info-icon">i</span>
      {isHovered && <span className="tooltiptext">{text}</span>}
      <style jsx>{`
        .tooltip {
          position: relative;
          display: inline-block;
          margin-left: 5px;
          cursor: pointer;
          vertical-align: middle;
        }
        .info-icon {
          display: inline-block;
          background: #CAEF7D;
          color: #1B1F13;
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
          width: 200px;
          background-color: #CAEF7D;
          color: #1B1F13;
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
          border-color: #CAEF7D transparent transparent transparent;
        }
      `}</style>
    </span>
  );
};

//
// Number to Words Converter
// Converts a number to a simple word representation (up to millions).
//
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

//
// Number to Words Percent Converter
// Converts a number to words and appends "percent".
//
const numberToWordsPercent = (value: number): string => {
  if (value === undefined || value === null) return "";
  if (Number.isInteger(value)) {
    return numberToWords(value) + " percent";
  }
  const intPart = Math.floor(value);
  const decimalPart = Math.round((value - intPart) * 10);
  return `${numberToWords(intPart)} point ${numberToWords(decimalPart)} percent`;
};

//
// Main Sukanya Samriddhi Yojana Calculator Component
//
const SukanyaSamriddhiYojanaCalculator: React.FC = () => {
  // Define inputs according to logic
  const [inputs, setInputs] = useState<CalculatorInputs>({
    investmentMode: "Monthly",         // "Monthly" or "Yearly"
    investmentAmount: "",
    investmentDuration: "",
    currentInterestRate: "",
    daughtersAge: "",
    lumpSum: "",
    stepUp: "",
  });
  const [errors, setErrors] = useState<Partial<CalculatorInputs>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const validateInputs = (): boolean => {
    const newErrors: Partial<CalculatorInputs> = {};
    // Required fields: investmentAmount, investmentDuration, currentInterestRate, daughtersAge
    ["investmentAmount", "investmentDuration", "currentInterestRate", "daughtersAge"].forEach((field) => {
      const value = inputs[field as keyof CalculatorInputs];
      if (!value || isNaN(Number(value)) || Number(value) <= 0) {
        newErrors[field as keyof CalculatorInputs] = "Please enter a valid number";
      }
    });
    // Investment duration must be <= 15 (per SSY rules)
    if (Number(inputs.investmentDuration) > 15) {
      newErrors.investmentDuration = "Investment duration cannot exceed 15 years";
    }
    // Daughter's age must be less than 21
    if (Number(inputs.daughtersAge) >= 21) {
      newErrors.daughtersAge = "Daughter's age must be less than 21 years";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateResults = () => {
    if (!validateInputs()) return;
    setIsCalculating(true);

    // Parse inputs
    const mode = inputs.investmentMode; // "Monthly" or "Yearly"
    const baseInvestment = parseFloat(inputs.investmentAmount);
    const duration = parseFloat(inputs.investmentDuration); // years of deposit (max 15)
    const r = parseFloat(inputs.currentInterestRate) / 100; // annual rate
    const daughtersAge = parseFloat(inputs.daughtersAge);
    const lumpSum = inputs.lumpSum ? parseFloat(inputs.lumpSum) : 0;
    const stepUpPercent = inputs.stepUp ? parseFloat(inputs.stepUp) : 0;

    // Maturity happens at 21 years of daughter's age.
    const maturityPeriod = 21 - daughtersAge; // years from now until maturity

    // Regular Contributions Future Value
    let totalRegularFV = 0;
    let totalRegularInvested = 0;
    const yearWise: YearlyData[] = [];
    let currentDeposit = baseInvestment;
    for (let year = 1; year <= duration; year++) {
      // For Monthly mode, total contribution for the year:
      const annualContribution = mode === "Monthly" ? currentDeposit * 12 : currentDeposit;
      totalRegularInvested += annualContribution;
      // Deposits made at end of each year will compound for (maturityPeriod - year) years.
      const compoundingYears = Math.max(maturityPeriod - year, 0);
      const futureValueForYear = annualContribution * Math.pow(1 + r, compoundingYears);
      totalRegularFV += futureValueForYear;
      yearWise.push({
        year,
        totalInvested: parseFloat(totalRegularInvested.toFixed(2)),
        futureValue: parseFloat(totalRegularFV.toFixed(2)),
        wealthGained: parseFloat((totalRegularFV - totalRegularInvested).toFixed(2)),
      });
      // Update deposit for next year if step-up is provided
      currentDeposit = currentDeposit * (1 + stepUpPercent / 100);
    }

    // Lump Sum Future Value (if provided)
    const lumpSumFV = lumpSum * Math.pow(1 + r, maturityPeriod);
    const finalCorpus = totalRegularFV + lumpSumFV;
    const totalInvested = totalRegularInvested + lumpSum;
    const wealthGained = finalCorpus - totalInvested;

    setResults({
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      futureValue: parseFloat(finalCorpus.toFixed(2)),
      wealthGained: parseFloat(wealthGained.toFixed(2)),
      yearWise,
    });

    setTimeout(() => setIsCalculating(false), 1000);
  };

  // Prepare chart data from year-wise breakdown
  const chartData =
    results &&
    results.yearWise.map((data) => ({
      year: data.year,
      FutureValue: data.futureValue,
      WealthGained: data.wealthGained,
    }));

  return (
    <div className="container">
      {/* Back to Dashboard Button at Top */}
      <div className="top-nav">
        <Link href="/">
          <button className="back-button">Back to Dashboard</button>
        </Link>
      </div>

      <h1 className="title">Sukanya Samriddhi Yojana Calculator</h1>
      <p className="description">
        Plan for your daughter's financial future under the Sukanya Samriddhi Yojana scheme.
        Enter your investment details below to estimate the maturity value at 21 years.
      </p>

      <div className="form-container">
        <h2 className="section-title">Investment Details</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Investment Mode
              <Tooltip text="Select whether you plan to contribute Monthly or Yearly." />
            </span>
            <select
              name="investmentMode"
              value={inputs.investmentMode}
              onChange={handleInputChange}
              className="select-input"
            >
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </label>
          <label>
            <span className="input-label">
              Investment Amount (INR)
              <Tooltip text="Enter the amount you plan to invest every period." />
            </span>
            <input
              type="number"
              name="investmentAmount"
              value={inputs.investmentAmount}
              onChange={handleInputChange}
              placeholder="e.g., 5000"
            />
            <span className="converter">
              {inputs.investmentAmount && numberToWords(parseFloat(inputs.investmentAmount))} Rupees
            </span>
            {errors.investmentAmount && <span className="error">{errors.investmentAmount}</span>}
          </label>
          <label>
            <span className="input-label">
              Investment Duration (Years)
              <Tooltip text="Enter the number of years you plan to invest (max 15 years)." />
            </span>
            <input
              type="number"
              name="investmentDuration"
              value={inputs.investmentDuration}
              onChange={handleInputChange}
              placeholder="e.g., 15"
            />
            <span className="converter">
              {inputs.investmentDuration && numberToWords(parseFloat(inputs.investmentDuration))} Years
            </span>
            {errors.investmentDuration && <span className="error">{errors.investmentDuration}</span>}
          </label>
          <label>
            <span className="input-label">
              Current SSY Interest Rate (%)
              <Tooltip text="Enter the current SSY interest rate (compounded annually)." />
            </span>
            <input
              type="number"
              name="currentInterestRate"
              value={inputs.currentInterestRate}
              onChange={handleInputChange}
              placeholder="e.g., 7.6"
            />
            <span className="converter">
              {inputs.currentInterestRate &&
                numberToWordsPercent(parseFloat(inputs.currentInterestRate))}
            </span>
            {errors.currentInterestRate && <span className="error">{errors.currentInterestRate}</span>}
          </label>
          <label>
            <span className="input-label">
              Daughter's Current Age (Years)
              <Tooltip text="Enter your daughter's current age. (This ensures withdrawals are allowed only at maturity.)" />
            </span>
            <input
              type="number"
              name="daughtersAge"
              value={inputs.daughtersAge}
              onChange={handleInputChange}
              placeholder="e.g., 6"
            />
            <span className="converter">
              {inputs.daughtersAge && numberToWords(parseFloat(inputs.daughtersAge))} Years
            </span>
            {errors.daughtersAge && <span className="error">{errors.daughtersAge}</span>}
          </label>
        </div>

        <h2 className="section-title">Optional Details</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Lump Sum Investment (INR)
              <Tooltip text="Enter any one-time deposit you plan to make, if any." />
            </span>
            <input
              type="number"
              name="lumpSum"
              value={inputs.lumpSum}
              onChange={handleInputChange}
              placeholder="e.g., 50000"
            />
            <span className="converter">
              {inputs.lumpSum && numberToWords(parseFloat(inputs.lumpSum))} Rupees
            </span>
          </label>
          <label>
            <span className="input-label">
              Step-up SIP (%)
              <Tooltip text="Enter the annual percentage increase in your investment amount (if any)." />
            </span>
            <input
              type="number"
              name="stepUp"
              value={inputs.stepUp}
              onChange={handleInputChange}
              placeholder="e.g., 10"
            />
            <span className="converter">
              {inputs.stepUp && numberToWordsPercent(parseFloat(inputs.stepUp))}
            </span>
          </label>
        </div>

        <button className="calculate-button" onClick={calculateResults} disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {results && (
        <div className="results-container">
          <h2 className="results-title">SSY Summary</h2>
          <div className="summary-card">
            <div className="summary-item">
              <strong>Total Invested:</strong> ₹{results.totalInvested.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.totalInvested))} Rupees)
            </div>
            <div className="summary-item">
              <strong>Final Maturity Value:</strong> ₹{results.futureValue.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.futureValue))} Rupees)
            </div>
            <div className="summary-item">
              <strong>Total Interest Earned:</strong> ₹{results.wealthGained.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.wealthGained))} Rupees)
            </div>
          </div>
          
          <h2 className="results-title">SSY Growth Visualization</h2>
          {chartType === "line" && (
            <div className="chart-explanation">
              <p>This Growth Chart shows the total maturity value of your Sukanya Samriddhi Yojana investment over time. The green line demonstrates how your investment of ₹{parseFloat(inputs.investmentAmount).toLocaleString("en-IN")} {inputs.investmentMode.toLowerCase()} grows to ₹{results.futureValue.toLocaleString("en-IN")} by year {inputs.investmentDuration} with compounding at {inputs.currentInterestRate}% annually.</p>
            </div>
          )}
          {chartType === "bar" && (
            <div className="chart-explanation">
              <p>This Comparison Chart focuses on the interest earned from your investment. The dark line represents only the wealth gained (₹{results.wealthGained.toLocaleString("en-IN")}), which is the difference between your total investment and the final maturity amount. This demonstrates how compound interest significantly enhances your daughter's education fund.</p>
            </div>
          )}

          <div className="chart-toggle">
            <button
              onClick={() => setChartType("line")}
              className={chartType === "line" ? "active" : ""}
            >
              Growth Chart
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={chartType === "bar" ? "active" : ""}
            >
              Comparison Chart
            </button>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="90%" height={300}>
              {chartType === "line" ? (
                <LineChart data={chartData || []} margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                  <YAxis domain={["auto", "auto"]} tickFormatter={(val) => val.toLocaleString("en-IN")} />
                  <RechartsTooltip formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Future Value"]} />
                  <Legend />
                  <Line type="monotone" dataKey="FutureValue" stroke="#CAEF7D" strokeWidth={2} name="Future Value" />
                </LineChart>
              ) : (
                <LineChart data={chartData || []} margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                  <YAxis domain={["auto", "auto"]} tickFormatter={(val) => val.toLocaleString("en-IN")} />
                  <RechartsTooltip formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Wealth Gained"]} />
                  <Legend />
                  <Line type="monotone" dataKey="WealthGained" stroke="#1B1F13" strokeWidth={2} name="Wealth Gained" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          <h2 className="results-title">Year-wise SSY Growth</h2>
          <div className="amortization-table">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Total Invested (₹)</th>
                  <th>Future Value (₹)</th>
                  <th>Wealth Gained (₹)</th>
                </tr>
              </thead>
              <tbody>
                {results.yearWise.map((data) => (
                  <tr key={data.year}>
                    <td>{data.year}</td>
                    <td>{data.totalInvested.toLocaleString("en-IN")}</td>
                    <td>{data.futureValue.toLocaleString("en-IN")}</td>
                    <td>{data.wealthGained.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="disclaimer">
            <h4>Important Considerations</h4>
            <ul>
              <li>
                The maturity value is calculated using annual compounding.
              </li>
              <li>
                Deposits are allowed for a maximum of 15 years; thereafter, the accumulated corpus grows until maturity (age 21).
              </li>
              <li>
                Optional step-up contributions and lump-sum investments are factored in if provided.
              </li>
              <li>
                Actual returns may vary due to market fluctuations and changes in government rates.
              </li>
            </ul>
            <p>Please consult a financial advisor before making any major financial decisions.</p>
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
          margin-bottom: 2rem;
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
        }
        .chart-explanation p {
          margin: 0;
          line-height: 1.5;
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
        .wealth-difference {
          background: #f5f9e8;
          padding: 1rem;
          border-radius: 4px;
          text-align: center;
          font-size: 1.1rem;
          border: 1px solid #caef7d;
          margin-bottom: 1.5rem;
        }
        .wealth-difference p {
          margin: 0 0 0.5rem 0;
        }
        .recommendation {
          background: #1b1f13;
          color: #fcffee;
          padding: 0.75rem;
          border-radius: 4px;
          margin-top: 0.5rem;
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

export default SukanyaSamriddhiYojanaCalculator;