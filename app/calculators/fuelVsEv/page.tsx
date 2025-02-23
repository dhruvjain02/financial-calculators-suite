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
// Utility: Number to Words (Indian system)
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
  
  function convert(n: number): string {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
    }
    if (n < 1000) {
      return (
        units[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convert(n % 100) : "")
      );
    }
    if (n < 100000) {
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + convert(n % 1000) : "")
      );
    }
    if (n < 10000000) {
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + convert(n % 100000) : "")
      );
    }
    // Crores and beyond
    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "")
    );
  }
  
  return convert(Math.abs(Math.round(num)));
}

// -----------------------
// Interface: Calculator Inputs
// -----------------------
interface CalculatorInputs {
  evPrice: string;             // EV Price (INR)
  fuelVehiclePrice: string;    // Fuel Vehicle Price (INR)
  evRange: string;             // EV Range (km/charge)
  fuelMileage: string;         // Fuel Mileage (km/L)
  electricityPrice: string;    // Electricity Price (INR/kWh)
  fuelPrice: string;           // Fuel Price (INR/L)
  dailyDriving: string;        // Daily Driving Distance (km)
  annualEVMaintenance: string; // Annual EV Maintenance (INR)
  annualFuelMaintenance: string; // Annual Fuel Maintenance (INR)
  evIncentives?: string;       // EV Purchase Incentives (Optional, INR)
}

// Yearly cost structure for TCO
interface YearlyCost {
  year: number;
  evCumulative: number;
  fuelCumulative: number;
}

// Final results after 5-year analysis
interface Results {
  cumulativeEVCost: number;     // EV TCO after 5 years
  cumulativeFuelCost: number;   // Fuel TCO after 5 years
  breakEvenYear: number | null; // First year where EV < Fuel
  savings: number;              // total difference (Fuel - EV)
  co2Savings: number;           // annual CO2 saved
  yearWise: YearlyCost[];       // year-by-year cost
}

// Simple tooltip for “i” icon
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

const FuelvsElectricCalculator: React.FC = () => {
  // We store separate inputs for 2 Wheeler and 4 Wheeler
  const initialInputs: CalculatorInputs = {
    evPrice: "",
    fuelVehiclePrice: "",
    evRange: "",
    fuelMileage: "",
    electricityPrice: "",
    fuelPrice: "",
    dailyDriving: "",
    annualEVMaintenance: "",
    annualFuelMaintenance: "",
    evIncentives: "",
  };

  const [inputs2Wheeler, setInputs2Wheeler] = useState<CalculatorInputs>(initialInputs);
  const [inputs4Wheeler, setInputs4Wheeler] = useState<CalculatorInputs>(initialInputs);

  const [vehicleType, setVehicleType] = useState<"2 Wheeler" | "4 Wheeler">("4 Wheeler");
  const [currentInputs, setCurrentInputs] = useState<CalculatorInputs>(inputs4Wheeler);

  const [errors, setErrors] = useState<Partial<CalculatorInputs>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  // We fix a 5-year TCO analysis
  const analysisYears = 5;

  // Hardcode battery capacity: 2.5 kWh for 2 Wheeler, 50 kWh for 4 Wheeler
  const batteryCapacity = vehicleType === "2 Wheeler" ? 2.5 : 50;

  // Environmental Impact container reference
  const envImpactRef = useRef<HTMLDivElement>(null);

  // Toggle between 2 Wheeler & 4 Wheeler
  const handleVehicleTypeToggle = (newType: "2 Wheeler" | "4 Wheeler") => {
    if (vehicleType !== newType) {
      // Save current inputs to whichever set we were on
      if (vehicleType === "2 Wheeler") {
        setInputs2Wheeler(currentInputs);
      } else {
        setInputs4Wheeler(currentInputs);
      }
      // Switch vehicle type
      setVehicleType(newType);
      setResults(null); // reset results
      // Load the stored inputs for the new type
      setCurrentInputs(newType === "2 Wheeler" ? inputs2Wheeler : inputs4Wheeler);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentInputs((prev) => {
      const updated = { ...prev, [name]: value };
      return updated;
    });
  };

  // Validate required fields
  const validateInputs = (): boolean => {
    const newErrors: Partial<CalculatorInputs> = {};
    // Required fields for our 5-year TCO
    const required: (keyof CalculatorInputs)[] = [
      "evPrice",
      "fuelVehiclePrice",
      "evRange",
      "fuelMileage",
      "electricityPrice",
      "fuelPrice",
      "dailyDriving",
      "annualEVMaintenance",
      "annualFuelMaintenance",
    ];
    required.forEach((field) => {
      const val = currentInputs[field];
      if (!val || isNaN(Number(val)) || Number(val) < 0) {
        newErrors[field] = "Please enter a valid number";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Main calculation logic
  const calculateResults = () => {
    if (!validateInputs()) return;
    setIsCalculating(true);

    const evPrice = parseFloat(currentInputs.evPrice);
    const fuelVehiclePrice = parseFloat(currentInputs.fuelVehiclePrice);
    const evRange = parseFloat(currentInputs.evRange);
    const fuelMileage = parseFloat(currentInputs.fuelMileage);
    const electricityPrice = parseFloat(currentInputs.electricityPrice);
    const fuelPrice = parseFloat(currentInputs.fuelPrice);
    const dailyDriving = parseFloat(currentInputs.dailyDriving);
    const annualEVMaintenance = parseFloat(currentInputs.annualEVMaintenance);
    const annualFuelMaintenance = parseFloat(currentInputs.annualFuelMaintenance);
    const evIncentives = currentInputs.evIncentives ? parseFloat(currentInputs.evIncentives) : 0;

    // 5-year distance
    const annualDistance = dailyDriving * 365;
    const totalDistance = annualDistance * analysisYears;

    // Fuel & electricity cost
    const totalFuelCost = (annualDistance / fuelMileage) * fuelPrice * analysisYears;
    const totalElectricityCost = (annualDistance / evRange) * batteryCapacity * electricityPrice * analysisYears;

    // Maintenance cost
    const totalEVMaintenance = annualEVMaintenance * analysisYears;
    const totalFuelMaintenance = annualFuelMaintenance * analysisYears;

    // TCO
    const tcoEV = (evPrice - evIncentives) + totalElectricityCost + totalEVMaintenance;
    const tcoFuel = fuelVehiclePrice + totalFuelCost + totalFuelMaintenance;

    // Year-by-year cumulative
    let cumulativeEVCost = evPrice - evIncentives;
    let cumulativeFuelCost = fuelVehiclePrice;
    let breakEvenYear: number | null = null;

    const yearWise: YearlyCost[] = [];
    // annual cost
    const annualFuelCost = (annualDistance / fuelMileage) * fuelPrice + annualFuelMaintenance;
    const annualEVCost = (annualDistance / evRange) * batteryCapacity * electricityPrice + annualEVMaintenance;

    for (let i = 1; i <= analysisYears; i++) {
      cumulativeEVCost += annualEVCost;
      cumulativeFuelCost += annualFuelCost;
      yearWise.push({
        year: i,
        evCumulative: parseFloat(cumulativeEVCost.toFixed(2)),
        fuelCumulative: parseFloat(cumulativeFuelCost.toFixed(2)),
      });
      if (breakEvenYear === null && cumulativeEVCost < cumulativeFuelCost) {
        breakEvenYear = i;
      }
    }

    const savings = cumulativeFuelCost - cumulativeEVCost;

    // Environmental Impact (approx. CO2)
    // Assume 2.3 kg CO2/liter
    const litersPerYear = annualDistance / fuelMileage;
    const co2Savings = litersPerYear * 2.3; // per year

    setResults({
      cumulativeEVCost: parseFloat(cumulativeEVCost.toFixed(2)),
      cumulativeFuelCost: parseFloat(cumulativeFuelCost.toFixed(2)),
      breakEvenYear,
      savings: parseFloat(savings.toFixed(2)),
      co2Savings: parseFloat(co2Savings.toFixed(2)),
      yearWise,
    });

    setIsCalculating(false);
  };

  // Prepare data for chart
  const lineChartData =
    results &&
    results.yearWise.map((item) => ({
      year: item.year,
      "EV TCO": item.evCumulative,
      "Fuel TCO": item.fuelCumulative,
    }));

  // Recommendation
  const recommendation =
    results && results.savings > 0
      ? `Over 5 years, the EV is cheaper by about ₹${results.savings.toLocaleString("en-IN")}.`
      : results && results.savings < 0
      ? `Over 5 years, the fuel vehicle is cheaper by about ₹${Math.abs(results.savings).toLocaleString("en-IN")}.`
      : "";

  return (
    <div className="container">
      {/* Top Nav */}
      <div className="top-nav">
        <Link href="/">
          <button className="back-button">Back to Dashboard</button>
        </Link>
      </div>

      <h1 className="title">Fuel vs. Electric Vehicle Calculator</h1>
      <p className="description">
        Compare the 5-year total cost of ownership for a 2 Wheeler or 4 Wheeler EV vs. a fuel-based vehicle.
      </p>

      {/* Side-by-side toggle for 2 Wheeler vs 4 Wheeler */}
      <div className="toggle-container">
        <button
          onClick={() => handleVehicleTypeToggle("2 Wheeler")}
          className={vehicleType === "2 Wheeler" ? "toggle-button active" : "toggle-button"}
        >
          2 Wheeler
        </button>
        <button
          onClick={() => handleVehicleTypeToggle("4 Wheeler")}
          className={vehicleType === "4 Wheeler" ? "toggle-button active" : "toggle-button"}
        >
          4 Wheeler
        </button>
      </div>

      {/* Form */}
      <div className="form-container">
        <h2 className="section-title">Vehicle & Running Cost Details ({vehicleType})</h2>
        <div className="input-group">
          <label>
            <span className="input-label">
              EV Price (INR)
              <TooltipIcon text="Purchase price of the electric vehicle" />
            </span>
            <input
              type="number"
              name="evPrice"
              value={currentInputs.evPrice}
              onChange={handleInputChange}
              placeholder="e.g., 150000 (2W) / 1200000 (4W)"
            />
            {currentInputs.evPrice && (
              <p className="converter">{numberToWords(parseFloat(currentInputs.evPrice))} Rupees</p>
            )}
            {errors.evPrice && <span className="error">{errors.evPrice}</span>}
          </label>
          <label>
            <span className="input-label">
              Fuel Vehicle Price (INR)
              <TooltipIcon text="Purchase price of the petrol/diesel vehicle" />
            </span>
            <input
              type="number"
              name="fuelVehiclePrice"
              value={currentInputs.fuelVehiclePrice}
              onChange={handleInputChange}
              placeholder="e.g., 100000 (2W) / 1000000 (4W)"
            />
            {currentInputs.fuelVehiclePrice && (
              <p className="converter">
                {numberToWords(parseFloat(currentInputs.fuelVehiclePrice))} Rupees
              </p>
            )}
            {errors.fuelVehiclePrice && <span className="error">{errors.fuelVehiclePrice}</span>}
          </label>
          <label>
            <span className="input-label">
              EV Range (km/charge)
              <TooltipIcon text="Distance the EV can travel on a full charge" />
            </span>
            <input
              type="number"
              name="evRange"
              value={currentInputs.evRange}
              onChange={handleInputChange}
              placeholder="e.g., 75 (2W) / 300 (4W)"
            />
            {currentInputs.evRange && (
              <p className="converter">
                {numberToWords(parseFloat(currentInputs.evRange))} Kilometers
              </p>
            )}
            {errors.evRange && <span className="error">{errors.evRange}</span>}
          </label>
          <label>
            <span className="input-label">
              Fuel Mileage (km/L)
              <TooltipIcon text="Fuel vehicle mileage in km/liter" />
            </span>
            <input
              type="number"
              name="fuelMileage"
              value={currentInputs.fuelMileage}
              onChange={handleInputChange}
              placeholder="e.g., 40 (2W) / 15 (4W)"
            />
            {currentInputs.fuelMileage && (
              <p className="converter">
                {numberToWords(parseFloat(currentInputs.fuelMileage))} Kilometers per Liter
              </p>
            )}
            {errors.fuelMileage && <span className="error">{errors.fuelMileage}</span>}
          </label>
          <label>
            <span className="input-label">
              Electricity Price (INR/kWh)
              <TooltipIcon text="Cost of electricity per unit (kWh)" />
            </span>
            <input
              type="number"
              name="electricityPrice"
              value={currentInputs.electricityPrice}
              onChange={handleInputChange}
              placeholder="e.g., 8"
            />
            {currentInputs.electricityPrice && (
              <p className="converter">
                {numberToWords(parseFloat(currentInputs.electricityPrice))} Rupees per kWh
              </p>
            )}
            {errors.electricityPrice && <span className="error">{errors.electricityPrice}</span>}
          </label>
          <label>
            <span className="input-label">
              Fuel Price (INR/L)
              <TooltipIcon text="Petrol/diesel price per liter" />
            </span>
            <input
              type="number"
              name="fuelPrice"
              value={currentInputs.fuelPrice}
              onChange={handleInputChange}
              placeholder="e.g., 100"
            />
            {currentInputs.fuelPrice && (
              <p className="converter">
                {numberToWords(parseFloat(currentInputs.fuelPrice))} Rupees per Liter
              </p>
            )}
            {errors.fuelPrice && <span className="error">{errors.fuelPrice}</span>}
          </label>
          <label>
            <span className="input-label">
              Daily Driving Distance (km)
              <TooltipIcon text="Average daily commute/travel distance" />
            </span>
            <input
              type="number"
              name="dailyDriving"
              value={currentInputs.dailyDriving}
              onChange={handleInputChange}
              placeholder="e.g., 40"
            />
            {currentInputs.dailyDriving && (
              <p className="converter">
                {numberToWords(parseFloat(currentInputs.dailyDriving))} Kilometers
              </p>
            )}
            {errors.dailyDriving && <span className="error">{errors.dailyDriving}</span>}
          </label>
          <label>
            <span className="input-label">
              Annual EV Maintenance (INR)
              <TooltipIcon text="Estimated yearly maintenance for the EV" />
            </span>
            <input
              type="number"
              name="annualEVMaintenance"
              value={currentInputs.annualEVMaintenance}
              onChange={handleInputChange}
              placeholder="e.g., 2000 (2W) / 5000 (4W)"
            />
            {currentInputs.annualEVMaintenance && (
              <p className="converter">
                {numberToWords(parseFloat(currentInputs.annualEVMaintenance))} Rupees per year
              </p>
            )}
            {errors.annualEVMaintenance && (
              <span className="error">{errors.annualEVMaintenance}</span>
            )}
          </label>
          <label>
            <span className="input-label">
              Annual Fuel Maintenance (INR)
              <TooltipIcon text="Estimated yearly maintenance for the fuel vehicle" />
            </span>
            <input
              type="number"
              name="annualFuelMaintenance"
              value={currentInputs.annualFuelMaintenance}
              onChange={handleInputChange}
              placeholder="e.g., 1000 (2W) / 15000 (4W)"
            />
            {currentInputs.annualFuelMaintenance && (
              <p className="converter">
                {numberToWords(parseFloat(currentInputs.annualFuelMaintenance))} Rupees per year
              </p>
            )}
            {errors.annualFuelMaintenance && (
              <span className="error">{errors.annualFuelMaintenance}</span>
            )}
          </label>
          <label>
            <span className="input-label">
              EV Purchase Incentives (Optional)
              <TooltipIcon text="Any govt. subsidy or discount for EV" />
            </span>
            <input
              type="number"
              name="evIncentives"
              value={currentInputs.evIncentives}
              onChange={handleInputChange}
              placeholder="e.g., 20000"
            />
            {currentInputs.evIncentives && (
              <p className="converter">
                {numberToWords(parseFloat(currentInputs.evIncentives))} Rupees
              </p>
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
          <h2 className="results-title">5-Year TCO Comparison</h2>
          <div className="summary-card">
            <div className="summary-item">
              <strong>EV Total Cost (5 Years):</strong> ₹
              {results.cumulativeEVCost.toLocaleString("en-IN")}
            </div>
            <div className="summary-item">
              <strong>Fuel Vehicle Total Cost (5 Years):</strong> ₹
              {results.cumulativeFuelCost.toLocaleString("en-IN")}
            </div>
            <div className="summary-item">
              <strong>Break-even Year:</strong>{" "}
              {results.breakEvenYear ? results.breakEvenYear : "Not reached"}
            </div>
            <div className="summary-item">
              <strong>Total Difference:</strong> ₹
              {results.savings.toLocaleString("en-IN")}
            </div>
            <div className="summary-item">
              <strong>Recommendation:</strong> {recommendation}
            </div>
          </div>

          <h2 className="results-title">Year-wise Cost Projection</h2>
          <div className="chart-explanation">
            <p>
              The following chart shows the cumulative total cost for both EV and fuel vehicle year by year (over 5 years).
              Hover over the chart for details.
            </p>
          </div>
          <div className="chart-toggle">
            <button
              onClick={() => setChartType("line")}
              className={chartType === "line" ? "active" : ""}
            >
              Line Chart
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={chartType === "bar" ? "active" : ""}
            >
              Bar Chart
            </button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="90%" height={300}>
              {chartType === "line" ? (
                <LineChart
                  data={results.yearWise.map((y) => ({
                    year: y.year,
                    "EV TCO": y.evCumulative,
                    "Fuel TCO": y.fuelCumulative,
                  }))}
                  margin={{ left: 50, right: 30, top: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                  <YAxis tickFormatter={(val) => "₹" + val.toLocaleString("en-IN")} />
                  <RechartsTooltip
                    formatter={(value: number) => "₹" + Math.round(value).toLocaleString("en-IN")}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="EV TCO"
                    stroke="#CAEF7D"
                    strokeWidth={2}
                    name="EV Total Cost"
                  />
                  <Line
                    type="monotone"
                    dataKey="Fuel TCO"
                    stroke="#1B1F13"
                    strokeWidth={2}
                    name="Fuel Vehicle Total Cost"
                  />
                </LineChart>
              ) : (
                <BarChart
                  data={results.yearWise.map((y) => ({
                    year: y.year,
                    "EV TCO": y.evCumulative,
                    "Fuel TCO": y.fuelCumulative,
                  }))}
                  margin={{ left: 50, right: 30, top: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(val) => "₹" + val.toLocaleString("en-IN")} />
                  <RechartsTooltip
                    formatter={(value: number) => "₹" + Math.round(value).toLocaleString("en-IN")}
                  />
                  <Legend />
                  <Bar dataKey="EV TCO" fill="#CAEF7D" name="EV Total Cost" />
                  <Bar dataKey="Fuel TCO" fill="#1B1F13" name="Fuel Vehicle Total Cost" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Environmental Impact */}
          <div ref={envImpactRef} className="env-impact-container">
            <h2 className="results-title">Environmental Impact</h2>
            <div className="env-impact-content">
              <div className="env-impact-value">
                <p className="env-impact-number">
                  {Math.round(results.co2Savings).toLocaleString("en-IN")} kg CO₂/year
                </p>
              </div>
              <div className="env-impact-details">
                <p>
                  By opting for an EV, you can potentially save about{" "}
                  {Math.round(results.co2Savings).toLocaleString("en-IN")} kilograms of CO₂
                  emissions per year (assuming zero tailpipe emissions). This contributes to
                  cleaner air and a reduced carbon footprint.
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
              This calculator assumes a 5-year usage period. Resale values or financing costs are not included.
            </li>
            <li>
              Maintenance costs, battery capacity, and other inputs are estimates. Adjust them to match your actual usage.
            </li>
            <li>
              Environmental impact only accounts for direct CO₂ savings from not burning fuel. Electricity generation source may vary.
            </li>
            <li>
              Results are for reference only; consult a financial advisor before making major vehicle purchase decisions.
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
          margin-bottom: 2rem;
        }
        .toggle-container {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .toggle-button {
          background: transparent;
          border: 1px solid #1b1f13;
          padding: 0.5rem 1rem;
          cursor: pointer;
          border-radius: 4px;
          font-size: 1rem;
          transition: all 0.2s ease;
        }
        .toggle-button.active {
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
          font-size: 0.85rem;
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

export default FuelvsElectricCalculator;
