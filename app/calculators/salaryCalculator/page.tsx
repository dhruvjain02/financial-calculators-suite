"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// -----------------------
// Interfaces
// -----------------------
interface CalculatorInputs {
  annualCTC: string;               // Annual CTC (INR)
  bonusPercentage: string;         // Bonus % of CTC
  monthlyProfessionalTax: string;  // Monthly professional tax
  monthlyEmployerPF: string;       // Monthly employer PF contribution
  monthlyEmployeePF: string;       // Monthly employee PF contribution
  additionalMonthlyDeductions: string; // Additional monthly deductions
  // Optional
  incomeTaxSlab?: string;          // Income tax slab (%) (Optional)
  hraAllowances?: string;          // HRA & other allowances (INR) (Optional)
}

interface SalaryBreakdown {
  grossAnnualSalary: number;
  annualBonus: number;
  totalMonthlyDeductions: number;
  totalAnnualDeductions: number;
  takeHomeAnnualBeforeTax: number;
  takeHomeMonthlyBeforeTax: number;
  taxPaid?: number;
  finalTakeHomeAnnual?: number;
  finalTakeHomeMonthly?: number;
}

interface Results {
  breakdown: SalaryBreakdown;
}

// For Recharts data
interface ChartData {
  name: string;
  value: number;
}

// For Bar chart data
interface BarData {
  name: string;
  monthly: number;
}

// -----------------------
// Tooltip for question marks
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
// Utility: number to words
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

const toWordsRupees = (num: number) => {
  return `${numberToWords(Math.round(num))} Rupees`;
};

const numberToWordsPercent = (value: number): string => {
  if (value === undefined || value === null) return "";
  if (Number.isInteger(value)) return numberToWords(value) + " percent";
  const intPart = Math.floor(value);
  const decimalPart = Math.round((value - intPart) * 10);
  return `${numberToWords(intPart)} point ${numberToWords(decimalPart)} percent`;
};

// -----------------------
// Main CTC vs In-Hand Calculator Component
// -----------------------
const CTCvsInHandCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    annualCTC: "",
    bonusPercentage: "",
    monthlyProfessionalTax: "",
    monthlyEmployerPF: "",
    monthlyEmployeePF: "",
    additionalMonthlyDeductions: "",
    incomeTaxSlab: "",
    hraAllowances: "",
  });
  const [errors, setErrors] = useState<Partial<CalculatorInputs>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  // Input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Validation
  const validateInputs = (): boolean => {
    const newErrors: Partial<CalculatorInputs> = {};
    const requiredFields = [
      "annualCTC",
      "bonusPercentage",
      "monthlyProfessionalTax",
      "monthlyEmployerPF",
      "monthlyEmployeePF",
      "additionalMonthlyDeductions",
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

  // Calculation logic
  const calculateResults = () => {
    if (!validateInputs()) return;
    setIsCalculating(true);

    const annualCTC = parseFloat(inputs.annualCTC);
    const bonusPercentage = parseFloat(inputs.bonusPercentage) / 100;
    const monthlyProfessionalTax = parseFloat(inputs.monthlyProfessionalTax);
    const monthlyEmployerPF = parseFloat(inputs.monthlyEmployerPF);
    const monthlyEmployeePF = parseFloat(inputs.monthlyEmployeePF);
    const additionalMonthlyDeductions = parseFloat(inputs.additionalMonthlyDeductions);
    const taxSlab = inputs.incomeTaxSlab ? parseFloat(inputs.incomeTaxSlab) / 100 : 0;
    const hraAllowances = inputs.hraAllowances ? parseFloat(inputs.hraAllowances) : 0;

    // 1. Annual bonus
    const annualBonus = annualCTC * bonusPercentage;

    // 2. Gross annual salary (excl. bonus)
    const grossAnnualSalary = annualCTC - annualBonus;

    // 3. Total monthly deductions
    const totalMonthlyDeductions =
      monthlyProfessionalTax + monthlyEmployerPF + monthlyEmployeePF + additionalMonthlyDeductions;

    // 4. Total annual deductions
    const totalAnnualDeductions = totalMonthlyDeductions * 12;

    // 5. Take-home annual (before tax)
    const takeHomeAnnualBeforeTax = grossAnnualSalary - totalAnnualDeductions + annualBonus;

    // 6. Take-home monthly (before tax)
    const takeHomeMonthlyBeforeTax = takeHomeAnnualBeforeTax / 12;

    // 7. Income tax (if any)
    let taxPaid = 0;
    let finalTakeHomeAnnual = takeHomeAnnualBeforeTax;
    let finalTakeHomeMonthly = takeHomeMonthlyBeforeTax;
    if (taxSlab > 0) {
      const taxableIncome = grossAnnualSalary - hraAllowances;
      taxPaid = taxableIncome * taxSlab;
      finalTakeHomeAnnual = takeHomeAnnualBeforeTax - taxPaid;
      finalTakeHomeMonthly = finalTakeHomeAnnual / 12;
    }

    const breakdown: SalaryBreakdown = {
      grossAnnualSalary,
      annualBonus,
      totalMonthlyDeductions,
      totalAnnualDeductions,
      takeHomeAnnualBeforeTax,
      takeHomeMonthlyBeforeTax,
      ...(taxSlab > 0
        ? {
            taxPaid,
            finalTakeHomeAnnual,
            finalTakeHomeMonthly,
          }
        : {}),
    };

    setResults({ breakdown });
    setTimeout(() => setIsCalculating(false), 1000);
  };

  // Prepare chart data for the toggle
  // Pie data
  const pieData: ChartData[] = results
    ? (() => {
        const {
          grossAnnualSalary,
          annualBonus,
          totalAnnualDeductions,
          takeHomeAnnualBeforeTax,
          taxPaid = 0,
        } = results.breakdown;
        const netAfterTax =
          taxPaid > 0
            ? results.breakdown.finalTakeHomeAnnual || takeHomeAnnualBeforeTax
            : takeHomeAnnualBeforeTax;

        return [
          { name: "Gross Salary (excl. Bonus)", value: grossAnnualSalary },
          { name: "Bonus", value: annualBonus },
          { name: "Deductions", value: totalAnnualDeductions },
          { name: "Tax (If any)", value: taxPaid },
          { name: "Net In-Hand", value: netAfterTax },
        ];
      })()
    : [];

  // Bar data
  const barData: BarData[] = results
    ? (() => {
        const {
          totalMonthlyDeductions,
          taxPaid = 0,
          takeHomeMonthlyBeforeTax,
          finalTakeHomeMonthly,
        } = results.breakdown;
        const netMonthly =
          taxPaid > 0 ? finalTakeHomeMonthly || takeHomeMonthlyBeforeTax : takeHomeMonthlyBeforeTax;

        return [
          { name: "Gross Monthly", monthly: parseFloat(inputs.annualCTC) / 12 },
          { name: "Monthly Deductions", monthly: totalMonthlyDeductions },
          { name: "Net In-Hand", monthly: netMonthly },
        ];
      })()
    : [];

  // Colors for the pie slices
  const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#caef7d"];

  return (
    <div className="container">
      {/* Back to Dashboard */}
      <div className="top-nav">
        <Link href="/">
          <button className="back-button">Back to Dashboard</button>
        </Link>
      </div>

      <h1 className="title">CTC vs. In-Hand Salary Calculator</h1>
      <p className="description">
        Understand how your annual CTC breaks down into monthly in-hand salary after bonus, PF contributions, professional tax, and other deductions.
      </p>

      {/* Form */}
      <div className="form-container">
        <h2 className="section-title">Salary & Deductions Details</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Annual CTC (INR)
              <TooltipIcon text="Enter your total Cost-to-Company, including all benefits." />
            </span>
            <input
              type="number"
              name="annualCTC"
              value={inputs.annualCTC}
              onChange={handleInputChange}
              placeholder="e.g., 1200000"
            />
            {errors.annualCTC && <span className="error">{errors.annualCTC}</span>}
          </label>
          <label>
            <span className="input-label">
              Bonus Percentage (%)
              <TooltipIcon text="Enter the percentage of your CTC allocated as performance bonus." />
            </span>
            <input
              type="number"
              name="bonusPercentage"
              value={inputs.bonusPercentage}
              onChange={handleInputChange}
              placeholder="e.g., 10"
            />
            {errors.bonusPercentage && <span className="error">{errors.bonusPercentage}</span>}
          </label>
          <label>
            <span className="input-label">
              Monthly Professional Tax (INR)
              <TooltipIcon text="Enter your monthly professional tax deduction." />
            </span>
            <input
              type="number"
              name="monthlyProfessionalTax"
              value={inputs.monthlyProfessionalTax}
              onChange={handleInputChange}
              placeholder="e.g., 200"
            />
            {errors.monthlyProfessionalTax && (
              <span className="error">{errors.monthlyProfessionalTax}</span>
            )}
          </label>
          <label>
            <span className="input-label">
              Monthly Employer PF (INR)
              <TooltipIcon text="Enter your employer's monthly PF contribution." />
            </span>
            <input
              type="number"
              name="monthlyEmployerPF"
              value={inputs.monthlyEmployerPF}
              onChange={handleInputChange}
              placeholder="e.g., 1800"
            />
            {errors.monthlyEmployerPF && <span className="error">{errors.monthlyEmployerPF}</span>}
          </label>
          <label>
            <span className="input-label">
              Monthly Employee PF (INR)
              <TooltipIcon text="Enter your monthly PF contribution deducted from salary." />
            </span>
            <input
              type="number"
              name="monthlyEmployeePF"
              value={inputs.monthlyEmployeePF}
              onChange={handleInputChange}
              placeholder="e.g., 1800"
            />
            {errors.monthlyEmployeePF && <span className="error">{errors.monthlyEmployeePF}</span>}
          </label>
          <label>
            <span className="input-label">
              Additional Monthly Deductions (INR)
              <TooltipIcon text="Enter any other monthly deductions (loan EMIs, insurance, etc.)" />
            </span>
            <input
              type="number"
              name="additionalMonthlyDeductions"
              value={inputs.additionalMonthlyDeductions}
              onChange={handleInputChange}
              placeholder="e.g., 2000"
            />
            {errors.additionalMonthlyDeductions && (
              <span className="error">{errors.additionalMonthlyDeductions}</span>
            )}
          </label>
        </div>

        {/* Optional Advanced Fields */}
        <h2 className="section-title">Optional: Tax & Allowances</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Income Tax Slab (%)
              <TooltipIcon text="Enter your income tax slab (e.g. 10, 20, 30). This will reduce your net in-hand salary." />
            </span>
            <input
              type="number"
              name="incomeTaxSlab"
              value={inputs.incomeTaxSlab}
              onChange={handleInputChange}
              placeholder="e.g., 20"
            />
          </label>
          <label>
            <span className="input-label">
              HRA & Other Allowances (INR)
              <TooltipIcon text="Enter total tax-exempt allowances (HRA, LTA, etc.) if applicable." />
            </span>
            <input
              type="number"
              name="hraAllowances"
              value={inputs.hraAllowances}
              onChange={handleInputChange}
              placeholder="e.g., 50000"
            />
          </label>
        </div>

        <button className="calculate-button" onClick={calculateResults} disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {results && (
        <div className="results-container">
          <h2 className="results-title">CTC vs In-Hand Salary Breakdown</h2>
          <div className="summary-card">
            <div className="summary-item">
              <strong>Gross Annual Salary (Excl. Bonus):</strong>{" "}
              ₹{results.breakdown.grossAnnualSalary.toLocaleString("en-IN")}{" "}
              ({toWordsRupees(results.breakdown.grossAnnualSalary)})
            </div>
            <div className="summary-item">
              <strong>Annual Bonus:</strong> ₹{results.breakdown.annualBonus.toLocaleString("en-IN")}{" "}
              ({toWordsRupees(results.breakdown.annualBonus)})
            </div>
            <div className="summary-item">
              <strong>Total Annual Deductions:</strong>{" "}
              ₹{results.breakdown.totalAnnualDeductions.toLocaleString("en-IN")}{" "}
              ({toWordsRupees(results.breakdown.totalAnnualDeductions)})
            </div>
            <div className="summary-item">
              <strong>Take-Home (Annual, Before Tax):</strong>{" "}
              ₹{results.breakdown.takeHomeAnnualBeforeTax.toLocaleString("en-IN")}{" "}
              ({toWordsRupees(results.breakdown.takeHomeAnnualBeforeTax)})
            </div>
            <div className="summary-item">
              <strong>Take-Home (Monthly, Before Tax):</strong>{" "}
              ₹{results.breakdown.takeHomeMonthlyBeforeTax.toLocaleString("en-IN")}{" "}
              ({toWordsRupees(results.breakdown.takeHomeMonthlyBeforeTax)})
            </div>
            {results.breakdown.taxPaid !== undefined && (
              <>
                <div className="summary-item">
                  <strong>Estimated Tax Paid:</strong>{" "}
                  ₹{results.breakdown.taxPaid.toLocaleString("en-IN")}{" "}
                  ({toWordsRupees(results.breakdown.taxPaid)})
                </div>
                <div className="summary-item">
                  <strong>Final Take-Home (Annual):</strong>{" "}
                  ₹{results.breakdown.finalTakeHomeAnnual?.toLocaleString("en-IN")}{" "}
                  ({toWordsRupees(results.breakdown.finalTakeHomeAnnual || 0)})
                </div>
                <div className="summary-item">
                  <strong>Final Take-Home (Monthly):</strong>{" "}
                  ₹{results.breakdown.finalTakeHomeMonthly?.toLocaleString("en-IN")}{" "}
                  ({toWordsRupees(results.breakdown.finalTakeHomeMonthly || 0)})
                </div>
              </>
            )}
          </div>

          <h2 className="results-title">Salary Distribution Visualization</h2>
          <div className="chart-explanation">
            <p>
              Toggle between a pie chart that shows the distribution of your total CTC into base salary, bonus, deductions, tax, and net pay,
              and a bar chart that compares your monthly gross salary, monthly deductions, and net in-hand pay.
            </p>
          </div>

          {/* Toggle for Pie / Bar */}
          <div className="chart-toggle">
            <button onClick={() => setChartType("pie")} className={chartType === "pie" ? "active" : ""}>
              Pie Chart
            </button>
            <button onClick={() => setChartType("bar")} className={chartType === "bar" ? "active" : ""}>
              Bar Chart
            </button>
          </div>

          {chartType === "pie" ? (
            <PieChartContainer results={results} />
          ) : (
            <BarChartContainer results={results} inputs={inputs} />
          )}

          {/* Important Considerations Section */}
          <div className="disclaimer">
            <h4>Important Considerations</h4>
            <ul>
              <li>
                This calculator provides an approximate breakdown of your CTC vs. in-hand salary based on the inputs provided.
              </li>
              <li>
                Actual take-home pay may vary due to additional factors such as variable bonuses, special allowances, or changes in tax laws.
              </li>
              <li>
                The calculations use simplified assumptions and may not include all possible deductions.
              </li>
              <li>
                Consult with your HR or a financial advisor for personalized advice.
              </li>
            </ul>
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
        .input-group input {
          padding: 0.5rem;
          margin-top: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          height: 38px;
          width: 100%;
          box-sizing: border-box;
          font-size: 1rem;
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
        }
      `}</style>
    </div>
  );
};

// Colors for Pie slices
const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#caef7d"];

/**
 * Separate component for the Pie Chart
 */
const PieChartContainer: React.FC<{ results: Results }> = ({ results }) => {
  const {
    grossAnnualSalary,
    annualBonus,
    totalAnnualDeductions,
    takeHomeAnnualBeforeTax,
    taxPaid = 0,
  } = results.breakdown;

  const netAfterTax =
    taxPaid > 0
      ? results.breakdown.finalTakeHomeAnnual || takeHomeAnnualBeforeTax
      : takeHomeAnnualBeforeTax;

  const pieData: ChartData[] = [
    { name: "Gross Salary (excl. Bonus)", value: grossAnnualSalary },
    { name: "Bonus", value: annualBonus },
    { name: "Deductions", value: totalAnnualDeductions },
    { name: "Tax (If any)", value: taxPaid },
    { name: "Net In-Hand", value: netAfterTax },
  ];

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <RechartsTooltip
            formatter={(value: number, name: string) => [
              `₹${value.toLocaleString("en-IN")} (${toWordsRupees(value)})`,
              name,
            ]}
          />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
          <Pie
            dataKey="value"
            data={pieData}
            cx="50%"
            cy="45%"
            outerRadius={120}
            labelLine={true}
            label={({ name }) => name}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pie-legend">
        {pieData.map((entry, index) => (
          <div key={`legend-${index}`} className="legend-item">
            <span className="color-box" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
            <span className="legend-text">
              {entry.name}: ₹{entry.value.toLocaleString("en-IN")} ({toWordsRupees(entry.value)})
            </span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .pie-legend {
          margin-top: 1rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 0.5rem;
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          padding: 0.25rem;
        }
        .color-box {
          width: 12px;
          height: 12px;
          margin-right: 8px;
          border-radius: 2px;
        }
        .legend-text {
          flex: 1;
        }
      `}</style>
    </div>
  );
};

/**
 * Separate component for the Bar Chart
 */
const BarChartContainer: React.FC<{ results: Results; inputs: CalculatorInputs }> = ({
  results,
  inputs,
}) => {
  const {
    totalMonthlyDeductions,
    taxPaid = 0,
    takeHomeMonthlyBeforeTax,
    finalTakeHomeMonthly,
  } = results.breakdown;

  const netMonthly =
    taxPaid > 0 ? finalTakeHomeMonthly || takeHomeMonthlyBeforeTax : takeHomeMonthlyBeforeTax;

  const barData: BarData[] = [
    {
      name: "Gross Monthly",
      monthly: parseFloat(inputs.annualCTC) / 12,
    },
    {
      name: "Monthly Deductions",
      monthly: totalMonthlyDeductions,
    },
    {
      name: "Net In-Hand",
      monthly: netMonthly,
    },
  ];

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(val) => val.toLocaleString("en-IN")} />
          <RechartsTooltip
            formatter={(value: number) => `₹${value.toLocaleString("en-IN")} (${toWordsRupees(value)})`}
          />
          <Legend />
          <Bar dataKey="monthly" fill="#caef7d" name="Amount (Monthly)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CTCvsInHandCalculator;
