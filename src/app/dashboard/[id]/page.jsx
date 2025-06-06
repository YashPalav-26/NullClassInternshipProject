"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Eye,
  Clock,
  DollarSign,
  BarChart2,
} from "lucide-react";
import Header from "@/components/Header"; // Assuming Header component is correctly implemented

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const Breadcrumb = ({ stock }) => (
  <motion.div
    {...fadeInUp}
    className="flex items-center space-x-2 text-sm text-gray-400 my-4"
  >
    <a href="/" className="hover:text-blue-500">
      Home
    </a>
    <span>/</span>
    <a href="/dashboard" className="hover:text-blue-500">
      Stocks
    </a>
    <span>/</span>
    <span className="text-blue-500">{stock}</span>
  </motion.div>
);

const generateRandomData = (currentValue, points) => {
  const historicalData = [["Time", "Low", "Open", "Close", "High"]];
  let baseForHistorical = currentValue;
  if (points <= 0) return historicalData; // Guard against zero or negative points

  for (let i = 0; i < points; i++) {
    const time = new Date(
      Date.now() - (points - 1 - i) * 5000
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const fluctuationMagnitude = baseForHistorical * 0.001;
    let open =
      baseForHistorical + (Math.random() * 10 - 5) * fluctuationMagnitude;
    let close = open + (Math.random() * 10 - 5) * fluctuationMagnitude;
    let low = Math.min(open, close) - Math.random() * 5 * fluctuationMagnitude;
    let high = Math.max(open, close) + Math.random() * 5 * fluctuationMagnitude;

    open = Math.max(0.01, open);
    close = Math.max(0.01, close);
    low = Math.max(0.01, low);
    high = Math.max(0.01, high);

    historicalData.push([time, low, open, close, high]);
    baseForHistorical = close;
  }
  return historicalData;
};

const Chart = ({ chartType, width, height, data }) => {
  const lastDataPoint = data && data.length > 1 ? data[data.length - 1] : null;
  const currentDisplayValue =
    lastDataPoint && typeof lastDataPoint[3] === "number"
      ? lastDataPoint[3].toFixed(2)
      : "N/A";

  return (
    <div
      style={{ width, height }}
      className="bg-gray-700 rounded flex items-center justify-center text-gray-400"
    >
      <div className="text-center">
        <div>{chartType || "Chart"} (Mock)</div>
        <div className="text-sm mt-2">
          Data points: {Math.max(0, data.length - 1)}
        </div>
        <div className="text-xs mt-1">Current: {currentDisplayValue}</div>
      </div>
    </div>
  );
};

function getDataPointsStatic(range) {
  switch (range) {
    case "5M":
      return 5 * 12;
    case "10M":
      return 10 * 12;
    case "15M":
      return 15 * 12;
    case "30M":
      return 30 * 12;
    case "1H":
      return 60 * 12;
    default:
      return 5 * 12;
  }
}

const StockChart = ({ stock }) => {
  const [timeRange, setTimeRange] = useState("5M");
  const initialStockValue = 4253.71;

  const [currentValue, setCurrentValue] = useState(initialStockValue);
  const [data, setData] = useState(() =>
    generateRandomData(initialStockValue, getDataPointsStatic(timeRange))
  );
  const [change, setChange] = useState({ value: 0, percentage: 0 });

  const getDataPoints = useCallback((range) => {
    return getDataPointsStatic(range);
  }, []);

  // Effect 1: Handles regeneration of historical data when timeRange changes
  useEffect(() => {
    // console.log("StockChart: Effect 1 (timeRange change) running. New timeRange:", timeRange, "Current live value:", currentValue);
    const points = getDataPoints(timeRange);
    const newChartData = generateRandomData(currentValue, points); // Base new historical view on current live price
    setData(newChartData);

    // Calculate change based on this new historical window
    if (
      newChartData.length > 1 &&
      newChartData[1] &&
      typeof newChartData[1][2] === "number"
    ) {
      const firstOpenInWindow = newChartData[1][2];
      const lastCloseInWindow = newChartData[newChartData.length - 1][3];
      const changeVal = lastCloseInWindow - firstOpenInWindow;
      const changePercent =
        firstOpenInWindow !== 0 ? (changeVal / firstOpenInWindow) * 100 : 0;
      setChange({ value: changeVal, percentage: changePercent });
    } else {
      setChange({ value: 0, percentage: 0 }); // Reset if no valid data
    }
  }, [timeRange, currentValue, getDataPoints]); // This will run if timeRange changes OR if currentValue changes.
  // The latter means the historical view "rebases" on live price changes.

  // Effect 2: Interval for simulating "live" price updates to currentValue
  useEffect(() => {
    // console.log("StockChart: Effect 2 (live price ticker interval) setup.");
    const interval = setInterval(() => {
      setCurrentValue((prevLiveCurrentValue) => {
        const randomPercentageChange = (Math.random() - 0.5) * 0.0002; // Smaller, more realistic tick for live value
        const changeAmount = prevLiveCurrentValue * randomPercentageChange;
        const newLiveValue = Math.max(
          0.01,
          prevLiveCurrentValue + changeAmount
        );
        // console.log("StockChart: Interval updating currentValue to:", newLiveValue);
        return newLiveValue;
      });
    }, 2000); // Update live price more frequently for simulation effect

    return () => {
      // console.log("StockChart: Effect 2 (live price ticker interval) cleanup.");
      clearInterval(interval);
    };
  }, []); // This effect runs once to set up the interval. The interval updates currentValue.

  // Effect 3: Updates the chart data array when the "live" currentValue changes
  useEffect(() => {
    // This effect reacts to the `currentValue` being updated by the interval in Effect 2.
    // console.log("StockChart: Effect 3 (chart data update) running due to currentValue change:", currentValue);

    setData((prevChartData) => {
      if (!prevChartData || prevChartData.length === 0 || !prevChartData[0]) {
        // Fallback if prevChartData is invalid - should ideally not happen with proper init
        return generateRandomData(currentValue, getDataPoints(timeRange));
      }

      const newPointTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const lastBarInChart = prevChartData[prevChartData.length - 1];
      // The new bar's open is the close of the last bar in the chart, or current value if no last bar.
      let open =
        lastBarInChart && typeof lastBarInChart[3] === "number"
          ? lastBarInChart[3]
          : currentValue;
      let close = currentValue; // The new "live" price is the close of this new bar.

      // Ensure open, high, low, close make sense for a candle
      let low = Math.min(open, close);
      let high = Math.max(open, close);
      const barFluctuationMag = close * 0.0001; // Very small fluctuation for the candle itself
      low -= Math.random() * barFluctuationMag;
      high += Math.random() * barFluctuationMag;

      const newSingleDataPoint = [
        newPointTime,
        Math.max(0.01, low),
        Math.max(0.01, open),
        Math.max(0.01, close),
        Math.max(0.01, high),
      ];

      const dataWithoutHeader = prevChartData.slice(1);
      const updatedContent = [...dataWithoutHeader, newSingleDataPoint];

      // Prepend header and then take the last N points for the current timeRange
      return [
        prevChartData[0],
        ...updatedContent.slice(-getDataPoints(timeRange)),
      ];
    });

    // Calculate change based on current data state
    setData((currentData) => {
      // The "change" displayed should always be relative to the start of the current data window
      if (
        currentData.length > 1 &&
        currentData[1] &&
        typeof currentData[1][2] === "number"
      ) {
        const firstOpenInDisplayedWindow = currentData[1][2];
        const changeVal = currentValue - firstOpenInDisplayedWindow;
        const changePercent =
          firstOpenInDisplayedWindow !== 0
            ? (changeVal / firstOpenInDisplayedWindow) * 100
            : 0;
        // console.log("StockChart: Effect 3 updating 'change' display:", { value: changeVal, percentage: changePercent });
        setChange({ value: changeVal, percentage: changePercent });
      }
      return currentData; // Return the same data, this is just for accessing current state
    });
  }, [currentValue, timeRange, getDataPoints]); // Removed `data` from dependencies to prevent infinite loop

  const chartOptions = useMemo(
    () => ({
      backgroundColor: "transparent",
      chartArea: { width: "90%", height: "80%" },
      hAxis: {
        textStyle: { color: "#9CA3AF" },
        baselineColor: "#4B5563",
        gridlines: { color: "transparent" },
        format: "HH:mm",
      },
      vAxis: {
        textStyle: { color: "#9CA3AF" },
        baselineColor: "#4B5563",
        gridlines: { color: "#4B5563" },
      },
      legend: { position: "none" },
      candlestick: {
        fallingColor: { strokeWidth: 0, fill: "#EF4444" },
        risingColor: { strokeWidth: 0, fill: "#10B981" },
      },
      animation: { startup: true, duration: 1000, easing: "out" },
    }),
    []
  );

  return (
    <motion.div
      {...fadeInUp}
      className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg my-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">{stock}</h2>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-2xl md:text-3xl font-bold text-white">
              {currentValue.toFixed(2)}
            </span>
            <motion.span
              className={`flex items-center text-sm md:text-base ${
                change.value >= 0 ? "text-green-500" : "text-red-500"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={currentValue} // Animate when currentValue (and thus change) updates
            >
              {change.value >= 0 ? (
                <ArrowUpRight size={16} className="mr-1" />
              ) : (
                <ArrowDownRight size={16} className="mr-1" />
              )}
              {change.value > 0 ? "+" : ""}
              {change.value.toFixed(2)} ({change.percentage.toFixed(2)}%)
            </motion.span>
          </div>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <motion.button
            className="bg-blue-500 text-white px-3 py-2 md:px-4 text-xs md:text-sm rounded hover:bg-blue-600 transition-colors flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PlusCircle className="inline-block mr-1 md:mr-2" size={14} />{" "}
            Create Alert
          </motion.button>
          <motion.button
            className="bg-gray-700 text-white px-3 py-2 md:px-4 text-xs md:text-sm rounded hover:bg-gray-600 transition-colors flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye className="inline-block mr-1 md:mr-2" size={14} /> Watchlist
          </motion.button>
        </div>
      </div>
      <Chart
        chartType="CandlestickChart"
        width="100%"
        height="300px"
        data={data}
      />
      <div className="flex justify-around md:justify-between mt-4 overflow-x-auto space-x-1">
        {["5M", "10M", "15M", "30M", "1H"].map((range) => (
          <motion.button
            key={range}
            className={`text-xs sm:text-sm px-2 py-1 rounded ${
              timeRange === range
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            } transition-colors flex items-center`}
            onClick={() => setTimeRange(range)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Clock size={12} className="mr-1" /> {range}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// --- OptionsTable, OpenInterest, StockDetailPage components remain the same as your last provided version ---
// (Assuming they are correctly implemented and not causing this specific error)

const OptionsTable = ({ stock }) => {
  const [options, setOptions] = useState([
    {
      strike: 25400,
      callPrice: 115.15,
      callChange: 17.0,
      putPrice: 97.55,
      putChange: -15.55,
    },
    {
      strike: 25300,
      callPrice: 95.4,
      callChange: -10.9,
      putPrice: 96.65,
      putChange: 28.85,
    },
    {
      strike: 25200,
      callPrice: 78.5,
      callChange: 32.78,
      putPrice: 73.65,
      putChange: -12.25,
    },
    {
      strike: 25100,
      callPrice: 29.7,
      callChange: -10.14,
      putPrice: 28.3,
      putChange: 20.74,
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOptions((prevOptions) =>
        prevOptions.map((option) => ({
          ...option,
          callPrice: Math.max(
            0.01,
            option.callPrice + (Math.random() - 0.5) * (option.callPrice * 0.01)
          ),
          callChange: (Math.random() - 0.5) * 10,
          putPrice: Math.max(
            0.01,
            option.putPrice + (Math.random() - 0.5) * (option.putPrice * 0.01)
          ),
          putChange: (Math.random() - 0.5) * 10,
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      {...fadeInUp}
      className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg my-6 overflow-x-auto"
    >
      <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center">
        <DollarSign size={20} className="mr-2" /> Top {stock} Options
      </h3>
      <table className="w-full text-left min-w-[400px]">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700 text-xs md:text-sm">
            <th className="py-2 px-1 md:px-2">Strike</th>
            <th className="py-2 px-1 md:px-2">Call Price</th>
            <th className="py-2 px-1 md:px-2">Call Chg%</th>
            <th className="py-2 px-1 md:px-2">Put Price</th>
            <th className="py-2 px-1 md:px-2">Put Chg%</th>
          </tr>
        </thead>
        <tbody>
          {options.map((option, index) => (
            <motion.tr
              key={`${option.strike}-${index}`}
              className="border-b border-gray-700 text-xs md:text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <td className="py-2 px-1 md:px-2 text-white">{option.strike}</td>
              <td className="py-2 px-1 md:px-2 text-white">
                {option.callPrice.toFixed(2)}
              </td>
              <td className="py-2 px-1 md:px-2">
                <motion.div
                  className={
                    option.callChange >= 0 ? "text-green-500" : "text-red-500"
                  }
                  key={`call-${option.strike}-${option.callChange}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {option.callChange >= 0 ? (
                    <ArrowUpRight size={12} className="inline mr-0.5" />
                  ) : (
                    <ArrowDownRight size={12} className="inline mr-0.5" />
                  )}
                  {option.callChange.toFixed(2)}%
                </motion.div>
              </td>
              <td className="py-2 px-1 md:px-2 text-white">
                {option.putPrice.toFixed(2)}
              </td>
              <td className="py-2 px-1 md:px-2">
                <motion.div
                  className={
                    option.putChange >= 0 ? "text-green-500" : "text-red-500"
                  }
                  key={`put-${option.strike}-${option.putChange}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {option.putChange >= 0 ? (
                    <ArrowUpRight size={12} className="inline mr-0.5" />
                  ) : (
                    <ArrowDownRight size={12} className="inline mr-0.5" />
                  )}
                  {option.putChange.toFixed(2)}%
                </motion.div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

const OpenInterest = () => {
  const [oiData, setOiData] = useState({
    totalPutOI: 3513795,
    putCallRatio: 0.99,
    totalCallOI: 3555969,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setOiData((prevData) => ({
        totalPutOI: Math.max(
          0,
          prevData.totalPutOI + Math.floor((Math.random() - 0.5) * 10000)
        ),
        putCallRatio: Math.max(
          0.1,
          prevData.putCallRatio + (Math.random() - 0.5) * 0.01
        ),
        totalCallOI: Math.max(
          0,
          prevData.totalCallOI + Math.floor((Math.random() - 0.5) * 10000)
        ),
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      {...fadeInUp}
      className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg my-6"
    >
      <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center">
        <BarChart2 size={20} className="mr-2" /> Open Interest (OI)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm md:text-base">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center md:text-left"
        >
          <div className="text-gray-400">Total Put OI</div>
          <div className="text-white text-lg md:text-xl font-semibold">
            {oiData.totalPutOI.toLocaleString()}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="text-gray-400">Put/Call Ratio</div>
          <div className="text-white text-lg md:text-xl font-semibold">
            {oiData.putCallRatio.toFixed(2)}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center md:text-right"
        >
          <div className="text-gray-400">Total Call OI</div>
          <div className="text-white text-lg md:text-xl font-semibold">
            {oiData.totalCallOI.toLocaleString()}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function StockDetailPage({ params }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-white text-xl">Loading Chart Data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <Header />
      <main className="container mx-auto px-4 pb-8">
        <Breadcrumb stock={params.id} />
        <StockChart stock={params.id} />
        <OptionsTable stock={params.id} />
        <OpenInterest />
      </main>
    </div>
  );
}
