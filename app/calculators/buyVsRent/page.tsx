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

interface CalculatorInputs {
  // Buying Details
  propertyPrice: string;
  downPayment: string;
  loanTenure: string;
  interestRate: string;
  propertyAppreciation: string;
  incomeTaxBracket: string;
  maxTaxDeduction: string;
  // Renting Details
  currentMonthlyRent: string;
  rentInflation: string;
  investmentReturn: string;
}

interface Results {
  emi: string;
  totalEmiPaid: string;
  taxBenefit: string;
  finalHomeValue: string;
  buyingNetWorth: string;
  totalRentPaid: string;
  rentingNetWorth: string;
  decision: string;
  buyingData: Array<{ year: number; netWorth: number; annualCost: number }>;
  rentingData: Array<{ year: number; netWorth: number; annualRent: number }>;
}

/* =========================================
   1) Tooltip Component
   Displays info text on hover over an "i" icon
========================================= */
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

/* =========================================
   2) Number to Words Conversion Function
   Consistent with EMI calculator
========================================= */
const numberToWords = (num: number): string => {
  if (num === undefined || num === null) return "";
  
  // Round the number to handle decimals
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

/* =========================================
   3) Number to Words Percent
   Converts numbers to word format with percent
========================================= */
const numberToWordsPercent = (value: number): string => {
  if (value === undefined || value === null) return "";
  
  // If the user enters an integer
  if (Number.isInteger(value)) {
    return numberToWords(value) + " percent";
  }
  
  // If decimals exist, handle them
  const intPart = Math.floor(value);
  const decimalPart = Math.round((value - intPart) * 10);
  
  const intWords = numberToWords(intPart);
  const decimalWords = numberToWords(decimalPart);
  
  return `${intWords} point ${decimalWords} percent`;
};

/* =========================================
   4) Main Component
========================================= */
const BuyVsRentCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    // Buying
    propertyPrice: "",
    downPayment: "",
    loanTenure: "",
    interestRate: "",
    propertyAppreciation: "",
    incomeTaxBracket: "",
    maxTaxDeduction: "",
    // Renting
    currentMonthlyRent: "",
    rentInflation: "",
    investmentReturn: "",
  });

  const [errors, setErrors] = useState<Partial<CalculatorInputs>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  /* ==============================
     Handle Input
  ===============================*/
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  /* ==============================
     Validation
  ===============================*/
  const validateInputs = (): boolean => {
    const newErrors: Partial<CalculatorInputs> = {};
    Object.keys(inputs).forEach((key) => {
      const value = inputs[key as keyof CalculatorInputs];
      if (value.trim() === "" || isNaN(Number(value))) {
        newErrors[key as keyof CalculatorInputs] = "Please enter a valid number";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ==============================
     Calculation
  ===============================*/
  const calculateResults = () => {
    if (!validateInputs()) return;
    setIsCalculating(true);

    // Parse inputs
    // Buying
    const propertyPrice = parseFloat(inputs.propertyPrice);
    const downPayment = parseFloat(inputs.downPayment);
    const loanAmount = propertyPrice - downPayment;
    const loanTenure = parseFloat(inputs.loanTenure);
    const interestRate = parseFloat(inputs.interestRate);
    const propertyAppreciation = parseFloat(inputs.propertyAppreciation);
    const incomeTaxBracket = parseFloat(inputs.incomeTaxBracket);
    const maxTaxDeduction = parseFloat(inputs.maxTaxDeduction);

    // Renting
    const currentMonthlyRent = parseFloat(inputs.currentMonthlyRent);
    const rentInflation = parseFloat(inputs.rentInflation);
    const investmentReturn = parseFloat(inputs.investmentReturn);

    // --- Buying ---
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTenure * 12;
    const emi =
      (loanAmount *
        monthlyInterestRate *
        Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    const totalEmiPaid = emi * 12 * loanTenure;
    const totalInterest = totalEmiPaid - loanAmount;
    const taxBenefit = Math.min(totalInterest * (incomeTaxBracket / 100), maxTaxDeduction);
    const finalHomeValue = propertyPrice * Math.pow(1 + propertyAppreciation / 100, loanTenure);
    const buyingNetWorth = finalHomeValue - (downPayment + totalEmiPaid) + taxBenefit;

    // --- Renting ---
    let totalRentPaid = 0;
    let rentingNetWorth = 0; // Accumulate compounded savings
    const buyingData: Array<{ year: number; netWorth: number; annualCost: number }> = [];
    const rentingData: Array<{ year: number; netWorth: number; annualRent: number }> = [];

    for (let i = 0; i < loanTenure; i++) {
      const year = i + 1;
      // Yearly rent
      const yearlyRent = currentMonthlyRent * 12 * Math.pow(1 + rentInflation / 100, i);
      totalRentPaid += yearlyRent;

      const annualBuyingCost = emi * 12;
      const annualSavings = annualBuyingCost - yearlyRent;
      // Compound savings for the remaining years
      const compoundedSavings = annualSavings * Math.pow(1 + investmentReturn / 100, loanTenure - i);
      rentingNetWorth += compoundedSavings;

      // Year-wise data for buying
      const propertyValueAtYear = propertyPrice * Math.pow(1 + propertyAppreciation / 100, year);
      const cumulativeEmiPaid = emi * 12 * year;
      // Apportion the total taxBenefit across the years
      const taxBenefitPortion = taxBenefit * (year / loanTenure);

      const buyingNetWorthYear =
        propertyValueAtYear - (downPayment + cumulativeEmiPaid) + taxBenefitPortion;

      buyingData.push({
        year,
        netWorth: parseFloat(buyingNetWorthYear.toFixed(2)),
        annualCost: parseFloat(annualBuyingCost.toFixed(2)),
      });
      rentingData.push({
        year,
        netWorth: parseFloat(rentingNetWorth.toFixed(2)),
        annualRent: parseFloat(yearlyRent.toFixed(2)),
      });
    }

    const decision =
      buyingNetWorth > rentingNetWorth
        ? "Buying is financially better"
        : rentingNetWorth > buyingNetWorth
        ? "Renting and investing your savings is financially better"
        : "Both options are nearly equal";

    setResults({
      emi: emi.toFixed(2),
      totalEmiPaid: totalEmiPaid.toFixed(2),
      taxBenefit: taxBenefit.toFixed(2),
      finalHomeValue: finalHomeValue.toFixed(2),
      buyingNetWorth: buyingNetWorth.toFixed(2),
      totalRentPaid: totalRentPaid.toFixed(2),
      rentingNetWorth: rentingNetWorth.toFixed(2),
      decision,
      buyingData,
      rentingData,
    });

    // Simulate calculation delay
    setTimeout(() => {
      setIsCalculating(false);
    }, 1000);
  };

  // Data for the combined line chart: each entry includes Buying Net Worth and Renting Net Worth
  const combinedData =
    results &&
    results.buyingData.map((data, index) => ({
      year: data.year,
      "Buying Net Worth": data.netWorth,
      "Renting Net Worth": results.rentingData[index]?.netWorth || 0,
    }));

  return (
    <div className="container">
      {/* Top Navigation */}
      <div className="top-nav">
        <Link href="/">
          <button className="back-button">Back to Dashboard</button>
        </Link>
      </div>

      <h1 className="title">Should I Buy or Rent a Home?</h1>
      <p className="description">
        This tool evaluates the financial implications of buying versus renting. Enter your details
        below to see which option might build more wealth over time.
      </p>

      {/* Form */}
      <div className="form-container">
        <h2 className="section-title">Buying Details</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Property Price (INR)
              <Tooltip text="Total cost of the home, e.g. 50,00,000" />
            </span>
            <input
              type="number"
              name="propertyPrice"
              value={inputs.propertyPrice}
              onChange={handleInputChange}
              placeholder="e.g., 5000000"
            />
            <span className="converter">
              {inputs.propertyPrice && numberToWords(parseFloat(inputs.propertyPrice))} Rupees
            </span>
            {errors.propertyPrice && <span className="error">{errors.propertyPrice}</span>}
          </label>
          <label>
            <span className="input-label">
              Down Payment (INR)
              <Tooltip text="Amount paid upfront, e.g. 10,00,000" />
            </span>
            <input
              type="number"
              name="downPayment"
              value={inputs.downPayment}
              onChange={handleInputChange}
              placeholder="e.g., 1000000"
            />
            <span className="converter">
              {inputs.downPayment && numberToWords(parseFloat(inputs.downPayment))} Rupees
            </span>
            {errors.downPayment && <span className="error">{errors.downPayment}</span>}
          </label>
          <label>
            <span className="input-label">
              Loan Tenure (Years)
              <Tooltip text="Duration of the loan in years" />
            </span>
            <input
              type="number"
              name="loanTenure"
              value={inputs.loanTenure}
              onChange={handleInputChange}
              placeholder="e.g., 20"
            />
            <span className="converter">
              {inputs.loanTenure && numberToWords(parseFloat(inputs.loanTenure))} Years
            </span>
            {errors.loanTenure && <span className="error">{errors.loanTenure}</span>}
          </label>
          <label>
            <span className="input-label">
              Interest Rate (%)
              <Tooltip text="Annual interest rate, e.g. 7.5" />
            </span>
            <input
              type="number"
              name="interestRate"
              value={inputs.interestRate}
              onChange={handleInputChange}
              placeholder="e.g., 7.5"
            />
            <span className="converter">
              {inputs.interestRate && numberToWordsPercent(parseFloat(inputs.interestRate))}
            </span>
            {errors.interestRate && <span className="error">{errors.interestRate}</span>}
          </label>
          <label>
            <span className="input-label">
              Property Appreciation Rate (%)
              <Tooltip text="Expected yearly increase in property value" />
            </span>
            <input
              type="number"
              name="propertyAppreciation"
              value={inputs.propertyAppreciation}
              onChange={handleInputChange}
              placeholder="e.g., 5"
            />
            <span className="converter">
              {inputs.propertyAppreciation &&
                numberToWordsPercent(parseFloat(inputs.propertyAppreciation))}
            </span>
            {errors.propertyAppreciation && (
              <span className="error">{errors.propertyAppreciation}</span>
            )}
          </label>
          <label>
            <span className="input-label">
              Income Tax Bracket (%)
              <Tooltip text="Your tax bracket for calculating loan interest benefits" />
            </span>
            <input
              type="number"
              name="incomeTaxBracket"
              value={inputs.incomeTaxBracket}
              onChange={handleInputChange}
              placeholder="e.g., 30"
            />
            <span className="converter">
              {inputs.incomeTaxBracket &&
                numberToWordsPercent(parseFloat(inputs.incomeTaxBracket))}
            </span>
            {errors.incomeTaxBracket && (
              <span className="error">{errors.incomeTaxBracket}</span>
            )}
          </label>
          <label>
            <span className="input-label">
              Max Tax Deduction (INR)
              <Tooltip text="Upper limit of home loan interest deduction" />
            </span>
            <input
              type="number"
              name="maxTaxDeduction"
              value={inputs.maxTaxDeduction}
              onChange={handleInputChange}
              placeholder="e.g., 200000"
            />
            <span className="converter">
              {inputs.maxTaxDeduction &&
                numberToWords(parseFloat(inputs.maxTaxDeduction))} Rupees
            </span>
            {errors.maxTaxDeduction && (
              <span className="error">{errors.maxTaxDeduction}</span>
            )}
          </label>
        </div>

        <hr className="divider" />

        <h2 className="section-title">Renting Details</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Current Monthly Rent (INR)
              <Tooltip text="Your current monthly rent, e.g. 20,000" />
            </span>
            <input
              type="number"
              name="currentMonthlyRent"
              value={inputs.currentMonthlyRent}
              onChange={handleInputChange}
              placeholder="e.g., 20000"
            />
            <span className="converter">
              {inputs.currentMonthlyRent &&
                numberToWords(parseFloat(inputs.currentMonthlyRent))} Rupees
            </span>
            {errors.currentMonthlyRent && (
              <span className="error">{errors.currentMonthlyRent}</span>
            )}
          </label>
          <label>
            <span className="input-label">
              Rent Inflation Rate (%)
              <Tooltip text="Expected annual increase in rent" />
            </span>
            <input
              type="number"
              name="rentInflation"
              value={inputs.rentInflation}
              onChange={handleInputChange}
              placeholder="e.g., 3"
            />
            <span className="converter">
              {inputs.rentInflation && numberToWordsPercent(parseFloat(inputs.rentInflation))}
            </span>
            {errors.rentInflation && <span className="error">{errors.rentInflation}</span>}
          </label>
          <label>
            <span className="input-label">
              Investment Return Rate (%)
              <Tooltip text="Annual return on money saved by renting" />
            </span>
            <input
              type="number"
              name="investmentReturn"
              value={inputs.investmentReturn}
              onChange={handleInputChange}
              placeholder="e.g., 8"
            />
            <span className="converter">
              {inputs.investmentReturn &&
                numberToWordsPercent(parseFloat(inputs.investmentReturn))}
            </span>
            {errors.investmentReturn && (
              <span className="error">{errors.investmentReturn}</span>
            )}
          </label>
        </div>

        <button className="calculate-button" onClick={calculateResults} disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="results-container">
          <h2 className="results-title">Comparison Results</h2>
          <div className="decision-banner">
            <h3>{results.decision}</h3>
          </div>
          
          <div className="comparison-grid">
            <div className="comparison-column buying-column">
              <h3 className="comparison-title">Buying a Home</h3>
              <div className="result-card">
                <div className="result-item">
                  <div className="result-label">Monthly EMI</div>
                  <div className="result-value">₹{parseFloat(results.emi).toLocaleString('en-IN')}</div>
                  <div className="result-words">{numberToWords(parseFloat(results.emi))} Rupees</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Total EMI Paid</div>
                  <div className="result-value">₹{parseFloat(results.totalEmiPaid).toLocaleString('en-IN')}</div>
                  <div className="result-words">{numberToWords(parseFloat(results.totalEmiPaid))} Rupees</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Tax Benefit</div>
                  <div className="result-value">₹{parseFloat(results.taxBenefit).toLocaleString('en-IN')}</div>
                  <div className="result-words">{numberToWords(parseFloat(results.taxBenefit))} Rupees</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Final Property Value</div>
                  <div className="result-value">₹{parseFloat(results.finalHomeValue).toLocaleString('en-IN')}</div>
                  <div className="result-words">{numberToWords(parseFloat(results.finalHomeValue))} Rupees</div>
                </div>
                <div className="result-item highlight">
                  <div className="result-label">Net Worth After {inputs.loanTenure} Years</div>
                  <div className="result-value">₹{parseFloat(results.buyingNetWorth).toLocaleString('en-IN')}</div>
                  <div className="result-words">{numberToWords(parseFloat(results.buyingNetWorth))} Rupees</div>
                </div>
              </div>
            </div>
            
            <div className="comparison-column renting-column">
              <h3 className="comparison-title">Renting & Investing</h3>
              <div className="result-card">
                <div className="result-item">
                  <div className="result-label">Monthly Rent (Starting)</div>
                  <div className="result-value">₹{parseFloat(inputs.currentMonthlyRent).toLocaleString('en-IN')}</div>
                  <div className="result-words">{numberToWords(parseFloat(inputs.currentMonthlyRent))} Rupees</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Total Rent Paid</div>
                  <div className="result-value">₹{parseFloat(results.totalRentPaid).toLocaleString('en-IN')}</div>
                  <div className="result-words">{numberToWords(parseFloat(results.totalRentPaid))} Rupees</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Investment Return Rate</div>
                  <div className="result-value">{inputs.investmentReturn}%</div>
                  <div className="result-words">{numberToWordsPercent(parseFloat(inputs.investmentReturn))}</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Rent Inflation Rate</div>
                  <div className="result-value">{inputs.rentInflation}%</div>
                  <div className="result-words">{numberToWordsPercent(parseFloat(inputs.rentInflation))}</div>
                </div>
                <div className="result-item highlight">
                  <div className="result-label">Net Worth After {inputs.loanTenure} Years</div>
                  <div className="result-value">₹{parseFloat(results.rentingNetWorth).toLocaleString('en-IN')}</div>
                  <div className="result-words">{numberToWords(parseFloat(results.rentingNetWorth))} Rupees</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="wealth-difference">
            <p>
              <strong>Wealth Difference:</strong> ₹{Math.abs(parseFloat(results.buyingNetWorth) - parseFloat(results.rentingNetWorth)).toLocaleString('en-IN')} 
              ({numberToWords(Math.round(Math.abs(parseFloat(results.buyingNetWorth) - parseFloat(results.rentingNetWorth))))} Rupees) 
              in favor of {parseFloat(results.buyingNetWorth) > parseFloat(results.rentingNetWorth) ? 'buying' : 'renting & investing'}
            </p>
            <div className="recommendation">
              <strong>Recommendation:</strong> Based on the numbers, you should consider {parseFloat(results.buyingNetWorth) > parseFloat(results.rentingNetWorth) ? 'buying a home' : 'renting and investing the difference'}. 
              {parseFloat(results.buyingNetWorth) > parseFloat(results.rentingNetWorth) 
                ? ' The property appreciation and tax benefits outweigh the rental investment returns in your scenario.' 
                : ' The investment returns on your savings outperform the property appreciation in your scenario.'}
            </div>
          </div>

          {/* Combined Line Chart: Buying vs Renting Net Worth */}
          {combinedData && (
            <div className="chart-container">
              <ResponsiveContainer width="90%" height={300}>
                <LineChart
                  data={combinedData}
                  margin={{ left: 50, right: 30, top: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    label={{ value: "Year", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tickFormatter={(val) => val.toLocaleString("en-IN")}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => value.toLocaleString("en-IN")}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Buying Net Worth"
                    stroke="#CAEF7D"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="Renting Net Worth"
                    stroke="#1B1F13"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Year-wise Table */}
          <h2 className="results-title">Year-wise Cashflow</h2>
          <div className="amortization-table">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Buying Net Worth (₹)</th>
                  <th>Renting Net Worth (₹)</th>
                  <th>Annual Buying Cost (₹)</th>
                  <th>Annual Rent (₹)</th>
                </tr>
              </thead>
              <tbody>
                {results.buyingData.map((data) => (
                  <tr key={data.year}>
                    <td>{data.year}</td>
                    <td>{data.netWorth.toLocaleString('en-IN')}</td>
                    <td>{results.rentingData[data.year-1]?.netWorth.toLocaleString('en-IN')}</td>
                    <td>{data.annualCost.toLocaleString('en-IN')}</td>
                    <td>{results.rentingData[data.year-1]?.annualRent.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Disclaimer */}
          <div className="disclaimer">
            <h4>Important Considerations</h4>
            <p>This calculator provides a financial comparison only. Your decision should also consider:</p>
            <ul>
              <li><strong>Lifestyle preferences:</strong> Home ownership brings stability but less flexibility than renting</li>
              <li><strong>Maintenance costs:</strong> Homeowners face additional expenses for repairs and upkeep</li>
              <li><strong>Market conditions:</strong> Property appreciation and investment returns may vary significantly</li>
              <li><strong>Time horizon:</strong> Short-term plans may favor renting, while long-term stability often favors buying</li>
            </ul>
            <p>The results shown are based on your inputs and are for illustration purposes only. Actual outcomes may vary. Please consult with a financial advisor before making major financial decisions.</p>
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
        .divider {
          border: none;
          border-top: 1px solid #ccc;
          margin: 2rem 0;
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
        .results-summary p {
          font-size: 1rem;
          margin: 0.5rem 0;
        }
        .decision-banner {
          background: #1b1f13;
          color: #fcffee;
          padding: 1rem;
          border-radius: 4px;
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .decision-banner h3 {
          font-size: 1.2rem;
          font-weight: bold;
          margin: 0;
        }
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .comparison-column {
          background: #f9f9f9;
          border-radius: 8px;
          overflow: hidden;
        }
        .comparison-title {
          background: #caef7d;
          color: #1b1f13;
          padding: 0.75rem;
          text-align: center;
          margin: 0;
          font-size: 1.1rem;
        }
        .buying-column .comparison-title {
          background: #caef7d;
        }
        .renting-column .comparison-title {
          background: #d9d9d9;
        }
        .result-card {
          padding: 1rem;
        }
        .result-item {
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
        }
        .result-item.highlight {
          background: #f5f9e8;
          padding: 0.75rem;
          border-radius: 4px;
          margin-top: 0.5rem;
          border: 1px solid #caef7d;
        }
        .result-label {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .result-value {
          font-size: 1.2rem;
          color: #1b1f13;
        }
        .result-words {
          font-size: 0.8rem;
          color: #777;
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
        .chart-container {
          margin: 2rem 0;
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
          margin-top: 2rem;
          font-size: 0.9rem;
          color: #555;
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        .disclaimer h4 {
          margin-top: 0;
          color: #1b1f13;
          margin-bottom: 0.5rem;
        }
        .disclaimer ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .disclaimer li {
          margin-bottom: 0.5rem;
        }
        .disclaimer li:last-child {
          margin-bottom: 0;
        }
        .disclaimer p {
          margin: 0.5rem 0;
        }
        @media (max-width: 768px) {
          .input-group {
            grid-template-columns: 1fr;
          }
          .chart-container {
            margin: 1.5rem 0;
          }
          .comparison-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default BuyVsRentCalculator;