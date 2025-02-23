"use client";
import Link from "next/link";

const calculators = [
  {
    id: "buyVsRent",
    question: "Should I Buy or Rent a Home?",
    info: "Analyze whether it's more cost-effective to buy a house or continue renting."
  },
  {
    id: "carVsCommute",
    question: "Buy a Car vs. Commute Calculator",
    info: "Compare owning a car versus using alternative commuting options."
  },
  {
    id: "emiCalculator",
    question: "EMI Calculator",
    info: "Estimate monthly loan payments for car, home, or other loans."
  },
  {
    id: "endowmentVsTerm",
    question: "Endowment Calculator",
    info: "Determine whether to continue your endowment policy or surrender it."
  },
  {
    id: "fdRdCalculator",
    question: "FD & RD Calculator",
    info: "Project maturity values and growth for Fixed and Recurring Deposits."
  },
  {
    id: "fdRetirementCalculator",
    question: "FD-Based Retirement Calculator",
    info: "Plan your retirement corpus using FD-based projections and more."
  },
  {
    id: "fireCalculator",
    question: "FIRE Calculator",
    info: "Evaluate if 25x your annual expenses is enough for early retirement."
  },
  {
    id: "firstCrore",
    question: "When Will I Make My First Crore?",
    info: "Find out how long it takes to accumulate ₹1 crore based on your investments."
  },
  {
    id: "fuelVsEv",
    question: "Fuel vs. Electric Vehicle Calculator",
    info: "Compare long-term costs of a fuel-based vehicle versus an electric one."
  },
  {
    id: "hourlyWage",
    question: "Hourly Wage Calculator",
    info: "Convert annual or monthly salary into an hourly wage figure."
  },
  {
    id: "mbaRoi",
    question: "MBA ROI Calculator",
    info: "Assess lost earnings during an MBA versus potential post-MBA salary growth."
  },
  {
    id: "npsVsMf",
    question: "Mutual Fund vs. NPS Tier I Calculator",
    info: "Compare market-driven Mutual Funds with government-backed NPS Tier I investments."
  },
  {
    id: "salaryCalculator",
    question: "CTC vs. In-Hand Salary Calculator",
    info: "Break down your Cost-to-Company into net monthly take-home pay."
  },
  {
    id: "sipCalculator",
    question: "SIP Calculator",
    info: "Explore potential returns of Systematic Investment Plans over time."
  },
  {
    id: "sukanyaSamruddhi",
    question: "Sukanya Samriddhi Yojana Calculator",
    info: "Compute maturity amounts and benefits of the SSY savings scheme."
  }
];

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="main-heading">Financial Calculators Suite</h1>
        <p className="tagline">Your one-stop solution for planning, comparing, and calculating your financial goals.</p>
      </header>
      <h2 className="dashboard-heading">Select a Calculator</h2>
      <div className="dashboard-grid">
        {calculators.map((calc) => (
          <div key={calc.id} className="calculator-card">
            <h2>{calc.question}</h2>
            <p>{calc.info}</p>
            <Link href={`/calculators/${calc.id}`} legacyBehavior>
              <a>
                <button>Calculate</button>
              </a>
            </Link>
          </div>
        ))}
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background-color: #FCFFEE;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
        }
        .dashboard-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .main-heading {
          font-size: 3rem;
          font-weight: bold;
          color: #1B1F13;
          margin: 0;
        }
        .tagline {
          font-size: 1.2rem;
          color: #1B1F13;
          margin-top: 0.5rem;
        }
        .dashboard-heading {
          text-align: center;
          margin: 1rem 0;
          font-weight: 600;
          font-size: 1.5rem;
          color: #1B1F13;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .calculator-card {
          background-color: #FCFFEE;
          border: 1px solid #CAEF7D;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
        }
        .calculator-card h2 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #1B1F13;
        }
        .calculator-card p {
          font-size: 0.9rem;
          color: #1B1F13;
          margin-bottom: 1rem;
        }
        .calculator-card button {
          background-color: #CAEF7D;
          border: none;
          color: #1B1F13;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        }
        .calculator-card button:hover {
          opacity: 0.9;
        }
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
