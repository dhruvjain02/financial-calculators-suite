"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
  annualSalary: string;         // Annual Salary (INR)
  workHoursPerWeek: string;     // Work Hours per Week
  vacationWeeks: string;        // Vacation Weeks per Year
  paidHolidays: string;         // Number of Paid Public Holidays per Year
  unpaidLeave?: string;         // Optional: Unpaid Leave (Weeks)
  bonuses?: string;             // Optional: Annual Bonuses (INR)
  deductions?: string;          // Optional: Annual Deductions (INR)
}

interface Results {
  theoreticalHourly: number;
  actualHourly: number;
}

interface ChartData {
  name: string;
  value: number;
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
// Main Hourly Wage Calculator Component
// -----------------------
const HourlyWageCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    annualSalary: "",
    workHoursPerWeek: "",
    vacationWeeks: "",
    paidHolidays: "",
    unpaidLeave: "",
    bonuses: "",
    deductions: "",
  });
  const [errors, setErrors] = useState<Partial<CalculatorInputs>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Validate required inputs
  const validateInputs = (): boolean => {
    const newErrors: Partial<CalculatorInputs> = {};
    const requiredFields = [
      "annualSalary",
      "workHoursPerWeek",
      "vacationWeeks",
      "paidHolidays",
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

    const annualSalary = parseFloat(inputs.annualSalary);
    const workHoursPerWeek = parseFloat(inputs.workHoursPerWeek);
    const vacationWeeks = parseFloat(inputs.vacationWeeks);
    const paidHolidays = parseFloat(inputs.paidHolidays);
    const unpaidLeave = inputs.unpaidLeave ? parseFloat(inputs.unpaidLeave) : 0;
    const bonuses = inputs.bonuses ? parseFloat(inputs.bonuses) : 0;
    const deductions = inputs.deductions ? parseFloat(inputs.deductions) : 0;

    // Theoretical hourly wage (assuming full-time work: 52 weeks)
    const theoreticalHours = workHoursPerWeek * 52;
    const theoreticalHourly = annualSalary / theoreticalHours;

    // Calculate paid holiday hours (assuming 5 workdays per week)
    const paidHolidayHours = (paidHolidays / 5) * workHoursPerWeek;
    // Actual work hours: subtract vacation weeks, unpaid leave (converted to hours), and paid holiday hours
    const actualHours = theoreticalHours - (vacationWeeks + unpaidLeave) * workHoursPerWeek - paidHolidayHours;
    const adjustedSalary = annualSalary + bonuses - deductions;
    const actualHourly = adjustedSalary / actualHours;

    setResults({
      theoreticalHourly,
      actualHourly,
    });
    setTimeout(() => setIsCalculating(false), 1000);
  };

  // Prepare chart data for Bar and Pie charts (rounding off values)
  const chartData: ChartData[] =
    results
      ? [
          { name: "Theoretical", value: Math.round(results.theoreticalHourly) },
          { name: "Actual", value: Math.round(results.actualHourly) },
        ]
      : [];

  // Colors for Pie Chart
  const COLORS = ["#1B1F13", "#CAEF7D"];

  // Calculate difference message using a non-null diff value
  const diff: number = results ? results.actualHourly - results.theoreticalHourly : 0;
  const diffMessage =
    results && diff !== 0
      ? diff > 0
        ? `Your actual hourly wage is ₹${Math.abs(diff).toFixed(2)} more per hour than the theoretical rate.`
        : `Your actual hourly wage is ₹${Math.abs(diff).toFixed(2)} less per hour than the theoretical rate.`
      : "";

  return (
    <div className="container">
      {/* Back to Dashboard Button at Top */}
      <div className="top-nav">
        <Link href="/">
          <button className="back-button">Back to Dashboard</button>
        </Link>
      </div>

      <h1 className="title">What is my effective hourly wage?</h1>
      <p className="description">
        Evaluate your real earnings per hour based on your work schedule and time off.
      </p>

      <div className="form-container">
        <h2 className="section-title">Enter Your Financial Details</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Annual Salary (INR)
              <TooltipIcon text="Enter your total annual income before taxes." />
            </span>
            <input
              type="number"
              name="annualSalary"
              value={inputs.annualSalary}
              onChange={handleInputChange}
              placeholder="e.g., 1200000"
            />
            <span className="converter">
              {inputs.annualSalary && numberToWords(parseFloat(inputs.annualSalary))} Rupees
            </span>
            {errors.annualSalary && <span className="error">{errors.annualSalary}</span>}
          </label>
          <label>
            <span className="input-label">
              Work Hours per Week
              <TooltipIcon text="Enter the number of hours you work each week." />
            </span>
            <input
              type="number"
              name="workHoursPerWeek"
              value={inputs.workHoursPerWeek}
              onChange={handleInputChange}
              placeholder="e.g., 40"
            />
            <span className="converter">
              {inputs.workHoursPerWeek && numberToWords(parseFloat(inputs.workHoursPerWeek))} Hours
            </span>
            {errors.workHoursPerWeek && <span className="error">{errors.workHoursPerWeek}</span>}
          </label>
          <label>
            <span className="input-label">
              Vacation Weeks per Year
              <TooltipIcon text="Enter the number of vacation weeks you take per year." />
            </span>
            <input
              type="number"
              name="vacationWeeks"
              value={inputs.vacationWeeks}
              onChange={handleInputChange}
              placeholder="e.g., 4"
            />
            <span className="converter">
              {inputs.vacationWeeks && numberToWords(parseFloat(inputs.vacationWeeks))} Weeks
            </span>
            {errors.vacationWeeks && <span className="error">{errors.vacationWeeks}</span>}
          </label>
          <label>
            <span className="input-label">
              Paid Public Holidays
              <TooltipIcon text="Enter the number of paid public holidays you get per year." />
            </span>
            <input
              type="number"
              name="paidHolidays"
              value={inputs.paidHolidays}
              onChange={handleInputChange}
              placeholder="e.g., 10"
            />
            <span className="converter">
              {inputs.paidHolidays && numberToWords(parseFloat(inputs.paidHolidays))} Days
            </span>
            {errors.paidHolidays && <span className="error">{errors.paidHolidays}</span>}
          </label>
          <label>
            <span className="input-label">
              Unpaid Leave (Optional, Weeks)
              <TooltipIcon text="Enter any additional unpaid leave weeks you take." />
            </span>
            <input
              type="number"
              name="unpaidLeave"
              value={inputs.unpaidLeave || ""}
              onChange={handleInputChange}
              placeholder="e.g., 1"
            />
            <span className="converter">
              {inputs.unpaidLeave && numberToWords(parseFloat(inputs.unpaidLeave))} Weeks
            </span>
          </label>
          <label>
            <span className="input-label">
              Bonuses (Optional, INR)
              <TooltipIcon text="Enter any annual bonus amounts you receive." />
            </span>
            <input
              type="number"
              name="bonuses"
              value={inputs.bonuses || ""}
              onChange={handleInputChange}
              placeholder="e.g., 50000"
            />
            <span className="converter">
              {inputs.bonuses && numberToWords(parseFloat(inputs.bonuses))} Rupees
            </span>
          </label>
          <label>
            <span className="input-label">
              Deductions (Optional, INR)
              <TooltipIcon text="Enter any annual deductions (taxes, etc.)." />
            </span>
            <input
              type="number"
              name="deductions"
              value={inputs.deductions || ""}
              onChange={handleInputChange}
              placeholder="e.g., 20000"
            />
            <span className="converter">
              {inputs.deductions && numberToWords(parseFloat(inputs.deductions))} Rupees
            </span>
          </label>
        </div>
        <button className="calculate-button" onClick={calculateResults} disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {results && (
        <div className="results-container">
          <h2 className="results-title">Hourly Wage Summary</h2>
          <div className="summary-card">
            <div className="summary-item">
              <strong>Theoretical Hourly Wage:</strong> ₹
              {results.theoreticalHourly.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.theoreticalHourly))} Rupees/hour)
            </div>
            <div className="summary-item">
              <strong>Actual Hourly Wage:</strong> ₹
              {results.actualHourly.toLocaleString("en-IN")} (
              {numberToWords(Math.round(results.actualHourly))} Rupees/hour)
            </div>
            {results.theoreticalHourly !== 0 && (
              <div className="summary-item">
                <strong>Difference:</strong> {diff >= 0 
                  ? `₹${Math.abs(diff).toLocaleString("en-IN")} more per hour`
                  : `₹${Math.abs(diff).toLocaleString("en-IN")} less per hour`}
              </div>
            )}
          </div>

          <h2 className="results-title">Graphical Comparison</h2>
          <div className="chart-explanation">
            <p>
              The charts below compare your theoretical hourly wage (based on a full-time schedule) with your actual hourly wage (after accounting for time off). Hover over the graphs for detailed values.
            </p>
            {chartType === "bar" && (
              <p>
                <strong>Bar Chart:</strong> Displays the two hourly wages side by side.
              </p>
            )}
            {chartType === "pie" && (
              <p>
                <strong>Pie Chart:</strong> Shows the proportional breakdown of your hourly wages.
              </p>
            )}
          </div>
          <div className="chart-toggle">
            <button onClick={() => setChartType("bar")} className={chartType === "bar" ? "active" : ""}>
              Bar Chart
            </button>
            <button onClick={() => setChartType("pie")} className={chartType === "pie" ? "active" : ""}>
              Pie Chart
            </button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="90%" height={300}>
              {chartType === "bar" ? (
                <BarChart data={chartData} margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => "₹" + val.toLocaleString("en-IN")} />
                  <RechartsTooltip formatter={(value: number) => "₹" + Math.round(value).toLocaleString("en-IN")} />
                  <Legend />
                  <Bar dataKey="value" fill="#1B1F13" name="Hourly Wage" />
                </BarChart>
              ) : chartType === "pie" ? (
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => "₹" + Math.round(value).toLocaleString("en-IN")} />
                  <Legend />
                </PieChart>
              ) : (
                <React.Fragment />
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {results && (
        <div className="disclaimer">
          <h4>Important Considerations</h4>
          <ul>
            <li>
              This calculator estimates your effective hourly wage based on your annual income and the actual hours you work after accounting for vacations, holidays, and leave.
            </li>
            <li>
              The theoretical hourly wage assumes a full-time schedule without any time off.
            </li>
            <li>
              Actual hourly earnings may vary based on bonuses, deductions, and changes in your work schedule.
            </li>
            <li>
              Results are for reference only; please consult a financial advisor for personalized advice.
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
        .explanation {
          display: none;
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

export default HourlyWageCalculator;
