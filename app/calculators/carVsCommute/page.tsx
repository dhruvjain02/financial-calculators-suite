"use client";
import React, { useState, useRef } from "react";
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
// Utility: Number to Words Converter (Indian numbering system)
// -----------------------
function numberToWords(num: number): string {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = [
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
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (num === 0) return "Zero";
  const convert = (n: number): string => {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
    if (n < 1000) return units[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  };
  return convert(Math.abs(Math.round(num)));
}

const numberToWordsPercent = (value: number): string => {
  if (Number.isInteger(value)) return numberToWords(value) + " percent";
  const intPart = Math.floor(value);
  const decimalPart = Math.round((value - intPart) * 10);
  return `${numberToWords(intPart)} point ${numberToWords(decimalPart)} percent`;
};

// -----------------------
// Interfaces
// -----------------------
interface CalculatorInputs {
  // Car Inputs
  carPrice: string;             // Car Purchase Price (INR)
  fuelEfficiency: string;       // Fuel Efficiency (km/L)
  fuelPrice: string;            // Fuel Price (INR/L)
  oneWayDistance: string;       // One-way Commute Distance (km)
  workingDays: string;          // Working Days per Month
  annualMaintenance: string;    // Annual Maintenance Cost (INR)
  annualInsurance: string;      // Annual Insurance Cost (INR)
  registrationTaxes: string;    // Registration & Taxes (INR)
  parkingTolls?: string;        // Parking & Toll Fees (INR/month, optional)
  expectedResale: string;       // Expected Resale Value (INR)
  depreciationRate: string;     // Depreciation Rate (% p.a.)
  // Public Transport Inputs
  dailyPublicFare: string;      // Daily Public Transport Fare (INR)
  tripsPerDay: string;          // Number of Trips per Day
}

interface YearlyCost {
  year: number;
  carCumulative: number;
  ptCumulative: number;
}

interface Results {
  totalCarCost: number;
  totalPTCost: number;
  savings: number;
  co2Savings: number;
  yearWise: YearlyCost[];
}

interface ChartData {
  year: number;
  "Car Cost": number;
  "PT Cost": number;
}

// -----------------------
// TooltipIcon Component
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
// Main Component: Buy a Car vs. Public Transport Calculator
// -----------------------
const BuyCarvsCommuteCalculator: React.FC = () => {
  // Fixed analysis period of 5 years
  const analysisYears = 5;

  const initialInputs: CalculatorInputs = {
    carPrice: "",
    fuelEfficiency: "",
    fuelPrice: "",
    oneWayDistance: "",
    workingDays: "",
    annualMaintenance: "",
    annualInsurance: "",
    registrationTaxes: "",
    parkingTolls: "",
    expectedResale: "",
    depreciationRate: "",
    dailyPublicFare: "",
    tripsPerDay: "",
  };

  const [inputs, setInputs] = useState<CalculatorInputs>(initialInputs);
  const [errors, setErrors] = useState<Partial<CalculatorInputs>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  // Ref for Environmental Impact section
  const envRef = useRef<HTMLDivElement>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Validate required inputs (parkingTolls is optional)
  const validateInputs = (): boolean => {
    const newErrors: Partial<CalculatorInputs> = {};
    const requiredFields: (keyof CalculatorInputs)[] = [
      "carPrice",
      "fuelEfficiency",
      "fuelPrice",
      "oneWayDistance",
      "workingDays",
      "annualMaintenance",
      "annualInsurance",
      "registrationTaxes",
      "expectedResale",
      "depreciationRate",
      "dailyPublicFare",
      "tripsPerDay",
    ];
    requiredFields.forEach((field) => {
      const value = inputs[field];
      if (!value || isNaN(Number(value)) || Number(value) < 0) {
        newErrors[field] = "Please enter a valid number";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculation Logic for a fixed 5-year period
  const calculateResults = () => {
    if (!validateInputs()) return;
    setIsCalculating(true);

    // Parse Car Inputs
    const carPrice = parseFloat(inputs.carPrice);
    const fuelEfficiency = parseFloat(inputs.fuelEfficiency);
    const fuelPrice = parseFloat(inputs.fuelPrice);
    const oneWayDistance = parseFloat(inputs.oneWayDistance);
    const workingDays = parseFloat(inputs.workingDays);
    const annualMaintenance = parseFloat(inputs.annualMaintenance);
    const annualInsurance = parseFloat(inputs.annualInsurance);
    const registrationTaxes = parseFloat(inputs.registrationTaxes);
    const parkingTolls = inputs.parkingTolls ? parseFloat(inputs.parkingTolls) : 0;
    const expectedResale = parseFloat(inputs.expectedResale);
    const depreciationRate = parseFloat(inputs.depreciationRate); // (Not used directly; we use straight-line depreciation)

    // Parse Public Transport Inputs
    const dailyPublicFare = parseFloat(inputs.dailyPublicFare);
    const tripsPerDay = parseFloat(inputs.tripsPerDay);

    // Calculate Commute Distances
    const dailyCommute = oneWayDistance * 2;
    const monthlyCommute = dailyCommute * workingDays;
    const annualDistance = dailyCommute * workingDays * 12;

    // Car Costs Calculations
    const dailyFuelConsumption = dailyCommute / fuelEfficiency;
    const dailyFuelCost = dailyFuelConsumption * fuelPrice;
    const monthlyFuelCost = dailyFuelCost * workingDays;
    const annualFuelCost = monthlyFuelCost * 12;
    const annualRecurringCost = annualMaintenance + annualInsurance + parkingTolls * 12;
    const annualDepreciation = (carPrice - expectedResale) / analysisYears;
    const totalCarCost =
      carPrice +
      (annualFuelCost + annualRecurringCost + annualDepreciation) * analysisYears +
      registrationTaxes -
      expectedResale;

    // Public Transport Cost Calculations
    const monthlyPTCost = dailyPublicFare * tripsPerDay * workingDays;
    const annualPTCost = monthlyPTCost * 12;
    const totalPTCost = annualPTCost * analysisYears;

    // Year-wise breakdown
    const yearWise: YearlyCost[] = [];
    let cumulativeCar = carPrice + registrationTaxes;
    let cumulativePT = 0;
    for (let year = 1; year <= analysisYears; year++) {
      cumulativeCar += annualFuelCost + annualRecurringCost + annualDepreciation;
      cumulativePT += annualPTCost;
      // Deduct resale value only in final year
      const carCumulative = year === analysisYears ? cumulativeCar - expectedResale : cumulativeCar;
      yearWise.push({
        year,
        carCumulative: parseFloat(carCumulative.toFixed(2)),
        ptCumulative: parseFloat(cumulativePT.toFixed(2)),
      });
    }

    const savings = totalCarCost - totalPTCost;

    // Environmental Impact: Annual CO₂ emissions from fuel consumption (Assume 2.3 kg CO₂ per liter fuel burned)
    const annualFuelConsumption = dailyFuelConsumption * workingDays * 12;
    const carCO2Emissions = annualFuelConsumption * 2.3;
    const co2Savings = carCO2Emissions; // Public transport assumed negligible emissions

    setResults({
      totalCarCost,
      totalPTCost,
      savings,
      co2Savings,
      yearWise,
    });
    setIsCalculating(false);
  };

  // Prepare chart data for line/bar chart (year-wise cumulative cost)
  const chartData: ChartData[] = results
    ? results.yearWise.map((data) => ({
        year: data.year,
        "Car Cost": data.carCumulative,
        "PT Cost": data.ptCumulative,
      }))
    : [];

  // Recommendation and cost difference
  let costDifferenceText = "";
  let recommendationText = "";
  if (results) {
    const diff = Math.abs(results.totalCarCost - results.totalPTCost);
    costDifferenceText = `Cost Difference: ₹${diff.toLocaleString("en-IN")}`;
    recommendationText =
      results.totalCarCost < results.totalPTCost
        ? `Car ownership is more cost-effective by ₹${(results.totalPTCost - results.totalCarCost).toLocaleString("en-IN")}.`
        : `Using public transport is more economical by ₹${(results.totalCarCost - results.totalPTCost).toLocaleString("en-IN")}.`;
  }

  return (
    <div className="container">
      {/* Back to Dashboard Button */}
      <div className="top-nav">
        <Link href="/">
          <button className="back-button">Back to Dashboard</button>
        </Link>
      </div>

      <h1 className="title">Buy a Car vs. Public Transport Calculator</h1>
      <p className="description">
        Compare the 5‑year total cost of owning a car versus using public transport for your daily commute.
      </p>

      {/* Form Container */}
      <div className="form-container">
        <h2 className="section-title">Car Details</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Car Purchase Price (INR)
              <TooltipIcon text="Enter the total cost of purchasing the car, including taxes and registration fees." />
            </span>
            <input
              type="number"
              name="carPrice"
              value={inputs.carPrice}
              onChange={handleInputChange}
              placeholder="e.g., 800000"
            />
            {inputs.carPrice && (
              <p className="converter">{numberToWords(parseFloat(inputs.carPrice))} Rupees</p>
            )}
            {errors.carPrice && <span className="error">{errors.carPrice}</span>}
          </label>
          <label>
            <span className="input-label">
              Fuel Efficiency (km/L)
              <TooltipIcon text="Enter the fuel efficiency of the car." />
            </span>
            <input
              type="number"
              name="fuelEfficiency"
              value={inputs.fuelEfficiency}
              onChange={handleInputChange}
              placeholder="e.g., 15"
            />
            {inputs.fuelEfficiency && (
              <p className="converter">{numberToWords(parseFloat(inputs.fuelEfficiency))} Kilometers per Liter</p>
            )}
            {errors.fuelEfficiency && <span className="error">{errors.fuelEfficiency}</span>}
          </label>
          <label>
            <span className="input-label">
              Fuel Price (INR/L)
              <TooltipIcon text="Enter the current fuel price per liter." />
            </span>
            <input
              type="number"
              name="fuelPrice"
              value={inputs.fuelPrice}
              onChange={handleInputChange}
              placeholder="e.g., 100"
            />
            {inputs.fuelPrice && (
              <p className="converter">{numberToWords(parseFloat(inputs.fuelPrice))} Rupees per Liter</p>
            )}
            {errors.fuelPrice && <span className="error">{errors.fuelPrice}</span>}
          </label>
          <label>
            <span className="input-label">
              One-way Commute Distance (km)
              <TooltipIcon text="Enter the distance from your home to your workplace." />
            </span>
            <input
              type="number"
              name="oneWayDistance"
              value={inputs.oneWayDistance}
              onChange={handleInputChange}
              placeholder="e.g., 10"
            />
            {inputs.oneWayDistance && (
              <p className="converter">{numberToWords(parseFloat(inputs.oneWayDistance))} Kilometers</p>
            )}
            {errors.oneWayDistance && <span className="error">{errors.oneWayDistance}</span>}
          </label>
          <label>
            <span className="input-label">
              Working Days per Month
              <TooltipIcon text="Enter the number of days you commute each month." />
            </span>
            <input
              type="number"
              name="workingDays"
              value={inputs.workingDays}
              onChange={handleInputChange}
              placeholder="e.g., 22"
            />
            {inputs.workingDays && (
              <p className="converter">{numberToWords(parseFloat(inputs.workingDays))} Days</p>
            )}
            {errors.workingDays && <span className="error">{errors.workingDays}</span>}
          </label>
          <label>
            <span className="input-label">
              Annual Maintenance Cost (INR)
              <TooltipIcon text="Enter your expected annual maintenance cost for the car." />
            </span>
            <input
              type="number"
              name="annualMaintenance"
              value={inputs.annualMaintenance}
              onChange={handleInputChange}
              placeholder="e.g., 12000"
            />
            {inputs.annualMaintenance && (
              <p className="converter">{numberToWords(parseFloat(inputs.annualMaintenance))} Rupees per year</p>
            )}
            {errors.annualMaintenance && <span className="error">{errors.annualMaintenance}</span>}
          </label>
          <label>
            <span className="input-label">
              Annual Insurance Cost (INR)
              <TooltipIcon text="Enter your annual car insurance premium." />
            </span>
            <input
              type="number"
              name="annualInsurance"
              value={inputs.annualInsurance}
              onChange={handleInputChange}
              placeholder="e.g., 24000"
            />
            {inputs.annualInsurance && (
              <p className="converter">{numberToWords(parseFloat(inputs.annualInsurance))} Rupees per year</p>
            )}
            {errors.annualInsurance && <span className="error">{errors.annualInsurance}</span>}
          </label>
          <label>
            <span className="input-label">
              Registration & Taxes (INR)
              <TooltipIcon text="Enter the one-time fees for registration and taxes." />
            </span>
            <input
              type="number"
              name="registrationTaxes"
              value={inputs.registrationTaxes}
              onChange={handleInputChange}
              placeholder="e.g., 50000"
            />
            {inputs.registrationTaxes && (
              <p className="converter">{numberToWords(parseFloat(inputs.registrationTaxes))} Rupees</p>
            )}
            {errors.registrationTaxes && <span className="error">{errors.registrationTaxes}</span>}
          </label>
          <label>
            <span className="input-label">
              Parking & Toll Fees (INR/month) (Optional)
              <TooltipIcon text="Enter your monthly parking and toll expenses, if any." />
            </span>
            <input
              type="number"
              name="parkingTolls"
              value={inputs.parkingTolls}
              onChange={handleInputChange}
              placeholder="e.g., 2000"
            />
            {inputs.parkingTolls && (
              <p className="converter">{numberToWords(parseFloat(inputs.parkingTolls))} Rupees per month</p>
            )}
          </label>
          <label>
            <span className="input-label">
              Expected Resale Value (INR)
              <TooltipIcon text="Enter the estimated resale value of the car after 5 years." />
            </span>
            <input
              type="number"
              name="expectedResale"
              value={inputs.expectedResale}
              onChange={handleInputChange}
              placeholder="e.g., 300000"
            />
            {inputs.expectedResale && (
              <p className="converter">{numberToWords(parseFloat(inputs.expectedResale))} Rupees</p>
            )}
            {errors.expectedResale && <span className="error">{errors.expectedResale}</span>}
          </label>
          <label>
            <span className="input-label">
              Depreciation Rate (% p.a.)
              <TooltipIcon text="Enter the annual depreciation rate for the car's value." />
            </span>
            <input
              type="number"
              name="depreciationRate"
              value={inputs.depreciationRate}
              onChange={handleInputChange}
              placeholder="e.g., 10"
            />
            {inputs.depreciationRate && (
              <p className="converter">{numberToWordsPercent(parseFloat(inputs.depreciationRate))}</p>
            )}
            {errors.depreciationRate && <span className="error">{errors.depreciationRate}</span>}
          </label>
        </div>

        <hr className="divider" />

        <h2 className="section-title">Public Transport Details</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              Daily Public Transport Fare (INR)
              <TooltipIcon text="Enter the cost of one public transport trip." />
            </span>
            <input
              type="number"
              name="dailyPublicFare"
              value={inputs.dailyPublicFare}
              onChange={handleInputChange}
              placeholder="e.g., 50"
            />
            {inputs.dailyPublicFare && (
              <p className="converter">{numberToWords(parseFloat(inputs.dailyPublicFare))} Rupees</p>
            )}
            {errors.dailyPublicFare && <span className="error">{errors.dailyPublicFare}</span>}
          </label>
          <label>
            <span className="input-label">
              Number of Trips per Day
              <TooltipIcon text="Typically 2 for a round-trip." />
            </span>
            <input
              type="number"
              name="tripsPerDay"
              value={inputs.tripsPerDay}
              onChange={handleInputChange}
              placeholder="e.g., 2"
            />
            {inputs.tripsPerDay && (
              <p className="converter">{numberToWords(parseFloat(inputs.tripsPerDay))} Trips</p>
            )}
            {errors.tripsPerDay && <span className="error">{errors.tripsPerDay}</span>}
          </label>
        </div>

        <button className="calculate-button" onClick={calculateResults} disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {/* Results Section */}
      {results && (
        <div className="results-container">
          <h2 className="results-title">Cost of Ownership Summary (5 Years)</h2>
          <div className="summary-card">
            <div className="summary-item">
              <strong>Car Total Cost:</strong> ₹{results.totalCarCost.toLocaleString("en-IN")}
            </div>
            <div className="summary-item">
              <strong>Public Transport Total Cost:</strong> ₹{results.totalPTCost.toLocaleString("en-IN")}
            </div>
            <div className="summary-item">
              <strong>Total Savings:</strong> ₹{results.savings.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Difference and Recommendation */}
          <div className="difference-block">
            <p>
              <strong>
                {results.totalCarCost < results.totalPTCost
                  ? "Car ownership is cheaper by:"
                  : "Public transport is cheaper by:"}
              </strong>{" "}
              ₹{Math.abs(results.totalCarCost - results.totalPTCost).toLocaleString("en-IN")}
            </p>
            <p>
              <strong>Recommendation:</strong>{" "}
              {results.totalCarCost < results.totalPTCost
                ? "You should consider buying a car."
                : "You should consider using public transport."}
            </p>
          </div>

          {/* Chart Section */}
          <div className="chart-explanation">
            <p>
              The chart below shows the cumulative cost for owning a car versus using public transport over a fixed 5‑year period.
              <br />
              Hover over the graph for detailed values.
            </p>
          </div>
          <div className="chart-toggle">
            <button onClick={() => setChartType("line")} className={chartType === "line" ? "active" : ""}>
              Line Chart
            </button>
            <button onClick={() => setChartType("bar")} className={chartType === "bar" ? "active" : ""}>
              Bar Chart
            </button>
          </div>
          {results && (
            <div className="chart-container">
              <ResponsiveContainer width="90%" height={300}>
                {chartType === "line" ? (
                  <LineChart
                    data={results.yearWise.map((data) => ({
                      year: data.year,
                      "Car Cost": data.carCumulative,
                      "PT Cost": data.ptCumulative,
                    }))}
                    margin={{ left: 50, right: 30, top: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                    <YAxis tickFormatter={(val) => "₹" + val.toLocaleString("en-IN")} />
                    <RechartsTooltip formatter={(value: number) => "₹" + Math.round(value).toLocaleString("en-IN")} />
                    <Legend />
                    <Line type="monotone" dataKey="Car Cost" stroke="#CAEF7D" strokeWidth={2} name="Car Cost" />
                    <Line type="monotone" dataKey="PT Cost" stroke="#1B1F13" strokeWidth={2} name="Public Transport Cost" />
                  </LineChart>
                ) : (
                  <BarChart
                    data={results.yearWise.map((data) => ({
                      year: data.year,
                      "Car Cost": data.carCumulative,
                      "PT Cost": data.ptCumulative,
                    }))}
                    margin={{ left: 50, right: 30, top: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(val) => "₹" + val.toLocaleString("en-IN")} />
                    <RechartsTooltip formatter={(value: number) => "₹" + Math.round(value).toLocaleString("en-IN")} />
                    <Legend />
                    <Bar dataKey="Car Cost" fill="#CAEF7D" name="Car Cost" />
                    <Bar dataKey="PT Cost" fill="#1B1F13" name="Public Transport Cost" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Environmental Impact Section */}
          <div ref={envRef} className="env-impact-container">
            <h2 className="results-title">Environmental Impact</h2>
            <div className="env-impact-content">
              <div className="env-impact-value">
                <p className="env-impact-number">CO₂ Savings: {Math.round(results.co2Savings)} kg/year</p>
              </div>
              <div className="env-impact-details">
                <p>
                  By using public transport instead of driving a car, you can save approximately {Math.round(results.co2Savings)} kg of CO₂ emissions per year, thereby reducing your carbon footprint.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {results && (
      <div className="disclaimer">
        <h4>Important Considerations</h4>
        <ul>
          <li>
            This calculator estimates the 5‑year total cost of car ownership, including purchase price, fuel costs, maintenance, insurance, registration fees, and optional parking/toll fees.
          </li>
          <li>
            Resale value is deducted only in the final year.
          </li>
          <li>
            Environmental impact is estimated based solely on CO₂ savings from reduced fuel consumption.
          </li>
          <li>
            Results are for reference only; please consult a financial advisor before making any major vehicle purchase decisions.
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
          font-size: 1rem;
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
        .difference-block {
          background: #f5f9e8;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          text-align: center;
          font-size: 1.1rem;
        }
        .chart-explanation {
          background: #f0f8e8;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          text-align: center;
          font-size: 0.95rem;
        }
        .chart-container {
          margin: 2rem 0;
          display: flex;
          justify-content: center;
        }
        .env-impact-container {
          background: #fff;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #3E4799;
          margin-bottom: 2rem;
        }
        .env-impact-content {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          justify-content: space-between;
          align-items: center;
        }
        .env-impact-value {
          flex: 1;
          text-align: center;
        }
        .env-impact-number {
          font-size: 2rem;
          font-weight: bold;
          color: #108e66;
        }
        .env-impact-details {
          flex: 2;
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
          .env-impact-content {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default BuyCarvsCommuteCalculator;
