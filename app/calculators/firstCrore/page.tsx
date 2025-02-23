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
  currentAge: string;
  currentSavings: string;
  currentAnnualIncome: string;
  annualSalaryIncrease: string; // in percent
  investmentProportion: string; // percent of salary saved annually
  expectedReturn: string;       // annual return (in percent)
  lumpsum?: string;             // optional one-time additional investment
  retirementAge?: string;       // optional retirement age limit
}

interface YearlyData {
  year: number;
  age: number;
  salary: number;
  annualInvestment: number;
  corpus: number;
  totalInvested: number;
}

interface Results {
  yearsRequired: number;
  finalCorpus: number;
  totalInvested: number;
  totalInterest: number;
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
          width: 200px;
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
          Corpus: ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
        <p className="desc">
          This line shows your total corpus growth over the years.
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
          Wealth Gained: ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
        <p className="desc">
          This area highlights the extra wealth gained beyond your total investment.
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
// Main First Crore Calculator Component
// -----------------------
const FirstCroreCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    currentAge: "",
    currentSavings: "",
    currentAnnualIncome: "",
    annualSalaryIncrease: "",
    investmentProportion: "",
    expectedReturn: "",
    lumpsum: "",
    retirementAge: "",
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
      "currentAge",
      "currentSavings",
      "currentAnnualIncome",
      "annualSalaryIncrease",
      "investmentProportion",
      "expectedReturn",
    ];
    requiredFields.forEach((field) => {
      const value = inputs[field as keyof CalculatorInputs];
      if (!value || isNaN(Number(value)) || Number(value) < 0) {
        newErrors[field as keyof CalculatorInputs] = "Please enter a valid number";
      }
    });
    // If retirement age is provided, it must be greater than current age
    if (inputs.retirementAge && Number(inputs.retirementAge) <= Number(inputs.currentAge)) {
      newErrors.retirementAge = "Retirement age must be greater than current age";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculation logic: compound the corpus year by year until it reaches 1 crore (₹1,00,00,000)
  const calculateResults = () => {
    if (!validateInputs()) return;
    setIsCalculating(true);

    const currentAge = parseFloat(inputs.currentAge);
    const currentSavings = parseFloat(inputs.currentSavings);
    const annualIncome = parseFloat(inputs.currentAnnualIncome);
    const salaryIncrease = parseFloat(inputs.annualSalaryIncrease) / 100;
    const investProp = parseFloat(inputs.investmentProportion) / 100;
    const expectedReturn = parseFloat(inputs.expectedReturn) / 100;
    const lumpsum = inputs.lumpsum ? parseFloat(inputs.lumpsum) : 0;
    const retirementAge = inputs.retirementAge ? parseFloat(inputs.retirementAge) : Infinity;

    let age = currentAge;
    let corpus = currentSavings + lumpsum;
    let salary = annualIncome;
    let totalInvested = currentSavings + lumpsum;
    const yearWise: YearlyData[] = [];
    let yearsRequired = 0;
    const target = 10000000; // ₹1 crore

    while (corpus < target && age < retirementAge) {
      yearsRequired++;
      age++;
      const annualInvestment = salary * investProp;
      totalInvested += annualInvestment;
      corpus = corpus * (1 + expectedReturn) + annualInvestment;
      yearWise.push({
        year: yearsRequired,
        age: age,
        salary: parseFloat(salary.toFixed(2)),
        annualInvestment: parseFloat(annualInvestment.toFixed(2)),
        corpus: parseFloat(corpus.toFixed(2)),
        totalInvested: parseFloat(totalInvested.toFixed(2)),
      });
      salary = salary * (1 + salaryIncrease);
    }

    const totalInterest = corpus - totalInvested;

    setResults({
      yearsRequired,
      finalCorpus: parseFloat(corpus.toFixed(2)),
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      yearWise,
    });
    setTimeout(() => setIsCalculating(false), 1000);
  };

  // Prepare chart data for line chart (Corpus growth) and area chart (Wealth gained)
  const lineChartData =
    results &&
    results.yearWise.map((data) => ({
      year: data.year,
      Corpus: data.corpus,
    }));

  const areaChartData =
    results &&
    results.yearWise.map((data) => ({
      year: data.year,
      WealthGained: data.corpus - data.totalInvested,
      Corpus: data.corpus,
    }));

  return (
    <div className="container">
      {/* Back to Dashboard Button at Top */}
      <div className="top-nav">
        <Link href="/">
          <button className="back-button">Back to Dashboard</button>
        </Link>
      </div>

      <h1 className="title">When Will I Make My First Crore?</h1>
      <p className="description">
        Estimate how long it will take you to accumulate ₹1 crore based on your current savings, annual income, and investment strategy.
      </p>

      <div className="form-container">
        <h2 className="section-title">Your Financial Details</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Current Age (Years)
              <TooltipIcon text="Enter your current age." />
            </span>
            <input
              type="number"
              name="currentAge"
              value={inputs.currentAge}
              onChange={handleInputChange}
              placeholder="e.g., 25"
            />
            <span className="converter">
              {inputs.currentAge && numberToWords(parseFloat(inputs.currentAge))} Years
            </span>
            {errors.currentAge && <span className="error">{errors.currentAge}</span>}
          </label>
          <label>
            <span className="input-label">
              Current Savings (INR)
              <TooltipIcon text="Enter the total amount you have saved so far." />
            </span>
            <input
              type="number"
              name="currentSavings"
              value={inputs.currentSavings}
              onChange={handleInputChange}
              placeholder="e.g., 200000"
            />
            <span className="converter">
              {inputs.currentSavings && numberToWords(parseFloat(inputs.currentSavings))} Rupees
            </span>
            {errors.currentSavings && <span className="error">{errors.currentSavings}</span>}
          </label>
          <label>
            <span className="input-label">
              Current Annual Income (INR)
              <TooltipIcon text="Enter your current total annual income." />
            </span>
            <input
              type="number"
              name="currentAnnualIncome"
              value={inputs.currentAnnualIncome}
              onChange={handleInputChange}
              placeholder="e.g., 600000"
            />
            <span className="converter">
              {inputs.currentAnnualIncome && numberToWords(parseFloat(inputs.currentAnnualIncome))} Rupees
            </span>
            {errors.currentAnnualIncome && <span className="error">{errors.currentAnnualIncome}</span>}
          </label>
          <label>
            <span className="input-label">
              Annual Increase in Salary (%)
              <TooltipIcon text="Enter the expected percentage increase in your salary per year." />
            </span>
            <input
              type="number"
              name="annualSalaryIncrease"
              value={inputs.annualSalaryIncrease}
              onChange={handleInputChange}
              placeholder="e.g., 5"
            />
            <span className="converter">
              {inputs.annualSalaryIncrease && numberToWordsPercent(parseFloat(inputs.annualSalaryIncrease))}
            </span>
            {errors.annualSalaryIncrease && <span className="error">{errors.annualSalaryIncrease}</span>}
          </label>
          <label>
            <span className="input-label">
              Investment Proportion (%)
              <TooltipIcon text="Enter the percentage of your salary that you save and invest each year." />
            </span>
            <input
              type="number"
              name="investmentProportion"
              value={inputs.investmentProportion}
              onChange={handleInputChange}
              placeholder="e.g., 20"
            />
            <span className="converter">
              {inputs.investmentProportion && numberToWordsPercent(parseFloat(inputs.investmentProportion))}
            </span>
            {errors.investmentProportion && <span className="error">{errors.investmentProportion}</span>}
          </label>
          <label>
            <span className="input-label">
              Expected Return on Investment (%)
              <TooltipIcon text="Enter the annual return rate (in percent) on your investments." />
            </span>
            <input
              type="number"
              name="expectedReturn"
              value={inputs.expectedReturn}
              onChange={handleInputChange}
              placeholder="e.g., 10"
            />
            <span className="converter">
              {inputs.expectedReturn && numberToWordsPercent(parseFloat(inputs.expectedReturn))}
            </span>
            {errors.expectedReturn && <span className="error">{errors.expectedReturn}</span>}
          </label>
          <label>
            <span className="input-label">
              Lumpsum Investment (Optional, INR)
              <TooltipIcon text="Enter any one-time investment you plan to make." />
            </span>
            <input
              type="number"
              name="lumpsum"
              value={inputs.lumpsum || ""}
              onChange={handleInputChange}
              placeholder="e.g., 50000"
            />
            <span className="converter">
              {inputs.lumpsum && numberToWords(parseFloat(inputs.lumpsum))} Rupees
            </span>
          </label>
          <label>
            <span className="input-label">
              Retirement Age (Optional)
              <TooltipIcon text="Enter your planned retirement age to cap the investment period." />
            </span>
            <input
              type="number"
              name="retirementAge"
              value={inputs.retirementAge || ""}
              onChange={handleInputChange}
              placeholder="e.g., 60"
            />
            <span className="converter">
              {inputs.retirementAge && numberToWords(parseFloat(inputs.retirementAge))} Years
            </span>
          </label>
        </div>
        <button className="calculate-button" onClick={calculateResults} disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {results && (
        <div className="results-container">
          <h2 className="results-title">Projection Summary</h2>
          <div className="summary-card">
            <div className="summary-item">
              <strong>Years Required:</strong> {results.yearsRequired}{" "}
              {results.yearsRequired > 0 && `(${numberToWords(results.yearsRequired)} years)`}
            </div>
            <div className="summary-item">
              <strong>Total Invested:</strong> ₹{results.totalInvested.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.totalInvested))} Rupees)
            </div>
            <div className="summary-item">
              <strong>Final Corpus:</strong> ₹{results.finalCorpus.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.finalCorpus))} Rupees)
            </div>
            <div className="summary-item">
              <strong>Total Interest Earned:</strong> ₹{results.totalInterest.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.totalInterest))} Rupees)
            </div>
            {results.yearWise.length > 0 && (
              <div className="summary-item">
                <strong>You will reach ₹1 crore at age:</strong>{" "}
                {results.yearWise[results.yearWise.length - 1].age} (
                {numberToWords(results.yearWise[results.yearWise.length - 1].age)} years)
              </div>
            )}
          </div>

          {/* Savings Tip Section */}
          <div className="tip-message">
            {parseFloat(inputs.investmentProportion) < 20
              ? "Tip: Your investment proportion is on the lower side. Consider increasing the percentage of your salary you save and invest to reach your goal faster."
              : "Tip: Great job on saving a good portion of your salary! Keep up the consistent investing to build your wealth even quicker."}
          </div>

          <h2 className="results-title">Corpus Growth Visualization</h2>
          {/* Explanation above the graph based on selected chart type */}
          <div className="chart-explanation">
            {chartType === "line" ? (
              <p>
                The Line Chart shows your overall corpus growth over time. This graph gives you a clear picture of how your total savings grow year by year with compound interest.
              </p>
            ) : (
              <p>
                The Area Chart not only shows your corpus growth but also highlights the extra wealth gained beyond your total investments. The filled area represents the additional returns from compounding.
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
                  <Line type="monotone" dataKey="Corpus" stroke="#CAEF7D" strokeWidth={2} name="Corpus Growth" />
                </LineChart>
              ) : chartType === "area" && areaChartData ? (
                <AreaChart data={areaChartData} margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                  <YAxis domain={["auto", "auto"]} tickFormatter={(val) => val.toLocaleString("en-IN")} />
                  <RechartsTooltip content={CustomAreaTooltip} />
                  <Legend />
                  <Area type="monotone" dataKey="WealthGained" stroke="#1B1F13" fill="#1B1F13" name="Wealth Gained" />
                  <Line type="monotone" dataKey="Corpus" stroke="#CAEF7D" strokeWidth={2} name="Corpus Growth" />
                </AreaChart>
              ) : (
                <></>
              )}
            </ResponsiveContainer>
          </div>

          <h2 className="results-title">Year-wise Breakdown</h2>
          <div className="amortization-table">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Age</th>
                  <th>Salary (INR)</th>
                  <th>Annual Investment (INR)</th>
                  <th>Corpus (INR)</th>
                </tr>
              </thead>
              <tbody>
                {results.yearWise.map((data) => (
                  <tr key={data.year}>
                    <td>{data.year}</td>
                    <td>{data.age}</td>
                    <td>{data.salary.toLocaleString("en-IN")}</td>
                    <td>{data.annualInvestment.toLocaleString("en-IN")}</td>
                    <td>{data.corpus.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="disclaimer">
            <h4>Important Considerations</h4>
            <ul>
              <li>
                This calculator uses compound interest to project your corpus by adding your annual investments.
              </li>
              <li>
                It assumes your salary grows at the specified rate and you invest a fixed percentage of your salary each year.
              </li>
              <li>
                Optional inputs (lumpsum and retirement age) are factored in if provided.
              </li>
              <li>
                Actual results may vary due to market fluctuations and changes in interest rates.
              </li>
            </ul>
            <p>Please consult with a financial advisor before making any major financial decisions.</p>
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
        .tip-message {
          background: #f0f8e8;
          padding: 1rem;
          border-left: 4px solid #caef7d;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          font-size: 1rem;
          text-align: center;
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

export default FirstCroreCalculator;
