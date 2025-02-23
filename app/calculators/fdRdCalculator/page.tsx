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

// -----------------------
// Interfaces for FD & RD Calculator
// -----------------------
interface CalculatorInputs {
  // FD Inputs
  principal: string;
  fdTenure: string;
  fdInterestRate: string;
  // RD Inputs
  monthlyDeposit: string;
  rdTenure: string;
  rdInterestRate: string;
  stepUp: string;
}

interface FDResults {
  maturityValue: number;
  totalInterest: number;
  chartData: { year: number; MaturityValue: number }[];
}

interface RDResults {
  totalInvested: number;
  maturityValue: number;
  totalInterest: number;
  yearWise: YearlyData[];
}

interface YearlyData {
  year: number;
  totalInvested: number;
  futureValue: number;
  wealthGained: number;
}

// -----------------------
// Tooltip Component
// -----------------------
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

// -----------------------
// Number to Words Converter Functions
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
// Main FD & RD Calculator Component with Toggle
// -----------------------
const FDRDCalculator: React.FC = () => {
  // State for active calculator ("fd" or "rd")
  const [activeCalc, setActiveCalc] = useState<"fd" | "rd">("fd");
  
  // Combined input state (we use all keys, but only the relevant ones are validated/calculated)
  const [inputs, setInputs] = useState<CalculatorInputs>({
    principal: "",
    fdTenure: "",
    fdInterestRate: "",
    monthlyDeposit: "",
    rdTenure: "",
    rdInterestRate: "",
    stepUp: "",
  });
  
  const [errors, setErrors] = useState<Partial<CalculatorInputs>>({});
  const [fdResults, setFdResults] = useState<FDResults | null>(null);
  const [rdResults, setRdResults] = useState<RDResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleCalc = (calcType: "fd" | "rd") => {
    setActiveCalc(calcType);
  };

  const validateInputs = (): boolean => {
    const newErrors: Partial<CalculatorInputs> = {};
    if (activeCalc === "fd") {
      // FD validation: principal, fdTenure, fdInterestRate
      ["principal", "fdTenure", "fdInterestRate"].forEach((field) => {
        const value = inputs[field as keyof CalculatorInputs];
        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
          newErrors[field as keyof CalculatorInputs] = "Please enter a valid number";
        }
      });
    } else {
      // RD validation: monthlyDeposit, rdTenure, rdInterestRate
      ["monthlyDeposit", "rdTenure", "rdInterestRate"].forEach((field) => {
        const value = inputs[field as keyof CalculatorInputs];
        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
          newErrors[field as keyof CalculatorInputs] = "Please enter a valid number";
        }
      });
      // Optional: stepUp is allowed to be empty (or zero)
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateResults = () => {
    if (!validateInputs()) return;
    setIsCalculating(true);

    if (activeCalc === "fd") {
      // -----------------
      // FD Calculation:
      // FD Maturity Value = Principal × (1 + (r/400))^(4 × fdTenure)
      // -----------------
      const fdPrincipal = parseFloat(inputs.principal);
      const fdTenure = parseFloat(inputs.fdTenure);
      const fdRate = parseFloat(inputs.fdInterestRate);
      const r_fd = fdRate / 400; // quarterly rate
      const fdMaturity = fdPrincipal * Math.pow(1 + r_fd, 4 * fdTenure);
      const fdInterest = fdMaturity - fdPrincipal;
      // Generate FD chart data: growth per year
      const fdChartData = [];
      for (let year = 1; year <= fdTenure; year++) {
        const maturityYear = fdPrincipal * Math.pow(1 + r_fd, 4 * year);
        fdChartData.push({ year, MaturityValue: parseFloat(maturityYear.toFixed(2)) });
      }
      setFdResults({
        maturityValue: parseFloat(fdMaturity.toFixed(2)),
        totalInterest: parseFloat(fdInterest.toFixed(2)),
        chartData: fdChartData,
      });
    } else {
      // -----------------
      // RD Calculation:
      // For RD: use quarterly compounding on each deposit.
      // -----------------
      const rdMonthly = parseFloat(inputs.monthlyDeposit);
      const rdTenure = parseFloat(inputs.rdTenure);
      const rdRate = parseFloat(inputs.rdInterestRate);
      const r_rd = rdRate / 400; // quarterly rate
      const stepUpPercent = inputs.stepUp ? parseFloat(inputs.stepUp) : 0;
      let totalRdInvested = 0;
      let totalRdFV = 0;
      const rdYearWise: YearlyData[] = [];
      let currentDeposit = rdMonthly;
      for (let year = 1; year <= rdTenure; year++) {
        const annualContribution = currentDeposit * 12;
        totalRdInvested += annualContribution;
        const compoundingYears = rdTenure - year;
        const fvForYear =
          annualContribution *
          ((Math.pow(1 + r_rd, 4 * compoundingYears) - 1) / r_rd) *
          (1 + r_rd);
        totalRdFV += fvForYear;
        rdYearWise.push({
          year,
          totalInvested: parseFloat(totalRdInvested.toFixed(2)),
          futureValue: parseFloat(totalRdFV.toFixed(2)),
          wealthGained: parseFloat((totalRdFV - totalRdInvested).toFixed(2)),
        });
        currentDeposit = currentDeposit * (1 + stepUpPercent / 100);
      }
      const rdInterest = totalRdFV - totalRdInvested;
      setRdResults({
        totalInvested: parseFloat(totalRdInvested.toFixed(2)),
        maturityValue: parseFloat(totalRdFV.toFixed(2)),
        totalInterest: parseFloat(rdInterest.toFixed(2)),
        yearWise: rdYearWise,
      });
    }

    setTimeout(() => setIsCalculating(false), 1000);
  };

  // Get the right chart data based on active calculator
  const fdChartData = fdResults?.chartData || [];
  const rdChartData = rdResults?.yearWise.map((data) => ({
    year: data.year,
    FutureValue: data.futureValue,
  })) || [];

  return (
    <div className="container">
      {/* Back to Dashboard Button at Top */}
      <div className="top-nav">
        <Link href="/">
          <button className="back-button">Back to Dashboard</button>
        </Link>
      </div>

      <h1 className="title">FD & RD Calculator</h1>
      <p className="description">
        Compare the final maturity value of Fixed Deposits (FD) versus Recurring Deposits (RD)
        based on your chosen investment strategy. Toggle between FD and RD to view their respective calculations.
      </p>

      {/* Toggle for FD and RD */}
      <div className="calc-toggle">
        <button
          onClick={() => handleToggleCalc("fd")}
          className={activeCalc === "fd" ? "active" : ""}
        >
          Fixed Deposit
        </button>
        <button
          onClick={() => handleToggleCalc("rd")}
          className={activeCalc === "rd" ? "active" : ""}
        >
          Recurring Deposit
        </button>
      </div>

      {/* Conditionally render form based on activeCalc */}
      {activeCalc === "fd" ? (
        <div className="form-container">
          <h2 className="section-title">Fixed Deposit (FD) Details</h2>
          <div className="input-group">
            <label>
              <span className="input-label">
                Initial Investment (INR)
                <Tooltip text="Enter the lump-sum amount for FD." />
              </span>
              <input
                type="number"
                name="principal"
                value={inputs.principal}
                onChange={handleInputChange}
                placeholder="e.g., 500000"
              />
              <span className="converter">
                {inputs.principal &&
                  numberToWords(parseFloat(inputs.principal))} Rupees
              </span>
              {errors.principal && <span className="error">{errors.principal}</span>}
            </label>
            <label>
              <span className="input-label">
                FD Tenure (Years)
                <Tooltip text="Enter the duration for the FD." />
              </span>
              <input
                type="number"
                name="fdTenure"
                value={inputs.fdTenure}
                onChange={handleInputChange}
                placeholder="e.g., 5"
              />
              <span className="converter">
                {inputs.fdTenure && numberToWords(parseFloat(inputs.fdTenure))} Years
              </span>
              {errors.fdTenure && <span className="error">{errors.fdTenure}</span>}
            </label>
            <label>
              <span className="input-label">
                FD Annual Interest Rate (%)
                <Tooltip text="Enter the annual FD interest rate (compounded quarterly)." />
              </span>
              <input
                type="number"
                name="fdInterestRate"
                value={inputs.fdInterestRate}
                onChange={handleInputChange}
                placeholder="e.g., 7.5"
              />
              <span className="converter">
                {inputs.fdInterestRate &&
                  numberToWordsPercent(parseFloat(inputs.fdInterestRate))}
              </span>
              {errors.fdInterestRate && <span className="error">{errors.fdInterestRate}</span>}
            </label>
          </div>
          <button className="calculate-button" onClick={calculateResults} disabled={isCalculating}>
            {isCalculating ? "Calculating..." : "Calculate"}
          </button>
        </div>
      ) : (
        <div className="form-container">
          <h2 className="section-title">Recurring Deposit (RD) Details</h2>
          <div className="input-group">
            <label>
              <span className="input-label">
                Monthly Deposit (INR)
                <Tooltip text="Enter the amount you plan to deposit every month in RD." />
              </span>
              <input
                type="number"
                name="monthlyDeposit"
                value={inputs.monthlyDeposit}
                onChange={handleInputChange}
                placeholder="e.g., 5000"
              />
              <span className="converter">
                {inputs.monthlyDeposit &&
                  numberToWords(parseFloat(inputs.monthlyDeposit))} Rupees
              </span>
              {errors.monthlyDeposit && <span className="error">{errors.monthlyDeposit}</span>}
            </label>
            <label>
              <span className="input-label">
                RD Tenure (Years)
                <Tooltip text="Enter the duration for the RD." />
              </span>
              <input
                type="number"
                name="rdTenure"
                value={inputs.rdTenure}
                onChange={handleInputChange}
                placeholder="e.g., 10"
              />
              <span className="converter">
                {inputs.rdTenure && numberToWords(parseFloat(inputs.rdTenure))} Years
              </span>
              {errors.rdTenure && <span className="error">{errors.rdTenure}</span>}
            </label>
            <label>
              <span className="input-label">
                RD Annual Interest Rate (%)
                <Tooltip text="Enter the annual RD interest rate (compounded quarterly)." />
              </span>
              <input
                type="number"
                name="rdInterestRate"
                value={inputs.rdInterestRate}
                onChange={handleInputChange}
                placeholder="e.g., 7.0"
              />
              <span className="converter">
                {inputs.rdInterestRate &&
                  numberToWordsPercent(parseFloat(inputs.rdInterestRate))}
              </span>
              {errors.rdInterestRate && <span className="error">{errors.rdInterestRate}</span>}
            </label>
            <label>
              <span className="input-label">
                Step-up (%) (Optional)
                <Tooltip text="If you plan to increase your RD contribution annually, enter the percentage increase." />
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
              {errors.stepUp && <span className="error">{errors.stepUp}</span>}
            </label>
          </div>
          <button className="calculate-button" onClick={calculateResults} disabled={isCalculating}>
            {isCalculating ? "Calculating..." : "Calculate"}
          </button>
        </div>
      )}

      {/* Display results based on active calculator */}
      {activeCalc === "fd" && fdResults && (
        <div className="results-container">
          <h2 className="results-title">FD Summary</h2>
          <div className="summary-card">
            <div className="summary-item">
              <strong>FD Final Maturity Value:</strong> ₹
              {fdResults.maturityValue.toLocaleString("en-IN")} (
              {numberToWords(Math.round(fdResults.maturityValue))} Rupees)
            </div>
            <div className="summary-item">
              <strong>FD Interest Earned:</strong> ₹
              {fdResults.totalInterest.toLocaleString("en-IN")} (
              {numberToWords(Math.round(fdResults.totalInterest))} Rupees)
            </div>
          </div>
          
          <h2 className="results-title">Growth Visualization</h2>
          <div className="chart-explanation">
            <p>This growth chart shows how your initial investment of ₹{parseFloat(inputs.principal).toLocaleString("en-IN")} grows over time with a fixed interest rate of {inputs.fdInterestRate}% compounded quarterly. At maturity after {inputs.fdTenure} years, your investment reaches ₹{fdResults.maturityValue.toLocaleString("en-IN")}.</p>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="90%" height={300}>
              <LineChart data={fdChartData} margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                <YAxis domain={["auto", "auto"]} tickFormatter={(val) => val.toLocaleString("en-IN")} />
                <RechartsTooltip formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Maturity Value"]} />
                <Legend />
                <Line type="monotone" dataKey="MaturityValue" stroke="#CAEF7D" strokeWidth={2} name="Maturity Value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="disclaimer">
            <h4>Important Considerations</h4>
            <ul>
              <li>
                FD Maturity is calculated using quarterly compounding: FV = P × (1 + (r/400))^(4 × Tenure)
              </li>
              <li>
                Tax implications are not factored in. Interest earned on FDs is taxable based on your income tax slab.
              </li>
              <li>
                Consider TDS (Tax Deducted at Source) implications if your interest income exceeds ₹40,000 per year (₹50,000 for senior citizens).
              </li>
              <li>
                Premature withdrawal may result in lower interest rates and penalties.
              </li>
            </ul>
            <p>Please consult with a financial advisor before making any major financial decisions.</p>
          </div>
        </div>
      )}

      {activeCalc === "rd" && rdResults && (
        <div className="results-container">
          <h2 className="results-title">RD Summary</h2>
          <div className="summary-card">
            <div className="summary-item">
              <strong>RD Total Invested:</strong> ₹
              {rdResults.totalInvested.toLocaleString("en-IN")} (
              {numberToWords(Math.round(rdResults.totalInvested))} Rupees)
            </div>
            <div className="summary-item">
              <strong>RD Final Maturity Value:</strong> ₹
              {rdResults.maturityValue.toLocaleString("en-IN")} (
              {numberToWords(Math.round(rdResults.maturityValue))} Rupees)
            </div>
            <div className="summary-item">
              <strong>RD Interest Earned:</strong> ₹
              {rdResults.totalInterest.toLocaleString("en-IN")} (
              {numberToWords(Math.round(rdResults.totalInterest))} Rupees)
            </div>
          </div>
          
          <h2 className="results-title">Growth Visualization</h2>
          <div className="chart-explanation">
            <p>This chart shows how your regular monthly deposits of ₹{parseFloat(inputs.monthlyDeposit).toLocaleString("en-IN")} grow over time with compound interest at {inputs.rdInterestRate}%. {inputs.stepUp && `The deposits increase by ${inputs.stepUp}% annually, helping your investment grow faster.`} After {inputs.rdTenure} years, your investment reaches a total of ₹{rdResults.maturityValue.toLocaleString("en-IN")}.</p>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="90%" height={300}>
              <LineChart data={rdChartData} margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                <YAxis domain={["auto", "auto"]} tickFormatter={(val) => val.toLocaleString("en-IN")} />
                <RechartsTooltip formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Future Value"]} />
                <Legend />
                <Line type="monotone" dataKey="FutureValue" stroke="#CAEF7D" strokeWidth={2} name="Future Value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <h2 className="results-title">Year-wise RD Growth</h2>
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
                {rdResults.yearWise.map((data) => (
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
                RD Maturity is calculated using quarterly compounding on each deposit and accounts for an optional step-up percentage.
              </li>
              <li>
                Interest earned on RDs is taxable based on your income tax slab rate.
              </li>
              <li>
                Missing installments may lead to penalties or lower interest rates.
              </li>
              <li>
                Consider the benefit of disciplined saving through regular deposits versus a lump-sum FD investment.
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
        .calc-toggle {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .calc-toggle button {
          background: transparent;
          border: 1px solid #1b1f13;
          padding: 0.5rem 1rem;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        .calc-toggle button.active {
          background: #caef7d;
          color: #1b1f13;
          border-color: #caef7d;
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

export default FDRDCalculator;