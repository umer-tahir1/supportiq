import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Empty } from "./Common";

const colors = {
  Negative: "#c97b65",
  Neutral: "#c8cfca",
  Positive: "#4c826d",
  Unanalyzed: "#9c9c9c",
};
const tooltipStyle = {
  border: "1px solid #e5e8e5",
  borderRadius: 10,
  fontSize: 12,
};

export function VolumeChart({ data, split = false }) {
  if (!data.length)
    return <Empty text="Import historical records to see complaint volume." />;
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -15, right: 12, top: 15 }}>
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4c826d" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#4c826d" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="#ecefeb"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#7b837d" }}
            tickLine={false}
            axisLine={false}
            minTickGap={35}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#7b837d" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey={split ? "historical" : "count"}
            name={split ? "Historical" : "Complaints"}
            stroke="#376c55"
            fill="url(#volumeFill)"
            strokeWidth={2}
          />
          {split && (
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="live"
              name="Customer portal"
              stroke="#a58145"
              fill="#eee5d4"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SentimentChart({ data }) {
  if (!data.length) return <Empty />;
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="sentiment-chart">
      <div className="donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              isAnimationActive={false}
              data={data}
              dataKey="count"
              nameKey="name"
              innerRadius={66}
              outerRadius={86}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.name} fill={colors[item.name] || "#a7b8ad"} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{total.toLocaleString()}</strong>
          <span>complaints</span>
        </div>
      </div>
      <div className="chart-legend">
        {data.map((item) => (
          <div key={item.name}>
            <span>
              <i style={{ background: colors[item.name] || "#a7b8ad" }} />
              {item.name}
            </span>
            <strong>
              {total ? ((100 * item.count) / total).toFixed(1) : 0}%
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RankedBars({ data, limit = 6 }) {
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map((item) => item.count), 1);
  return (
    <div className="ranked-bars">
      {data.slice(0, limit).map((item) => (
        <div key={item.name}>
          <div className="rank-label">
            <span>{item.name}</span>
            <strong>{item.count.toLocaleString()}</strong>
          </div>
          <div className="bar-track">
            <span style={{ width: `${(100 * item.count) / max}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SentimentByCategory({ data }) {
  if (!data.length) return <Empty />;
  return (
    <div className="chart tall">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.slice(0, 7)}
          layout="vertical"
          margin={{ left: 0, right: 20 }}
        >
          <CartesianGrid horizontal={false} stroke="#ecefeb" />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={175}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          {["Positive", "Neutral", "Negative", "Unanalyzed"].map((label) => (
            <Bar
              isAnimationActive={false}
              key={label}
              dataKey={label}
              stackId="sentiment"
              fill={colors[label]}
              maxBarSize={20}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryTrendChart({ data, categories }) {
  if (!data.length) return <Empty />;
  const palette = ["#376c55", "#a5834e", "#8098aa", "#b37d68", "#9b9b72"];
  return (
    <div className="chart tall">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -12, right: 18, top: 12 }}>
          <CartesianGrid
            vertical={false}
            stroke="#ecefeb"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10 }}
            minTickGap={35}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {categories.slice(0, 5).map((category, index) => (
            <Line
              key={category.name}
              name={category.name}
              dataKey={(row) => row.issues?.[category.name] || 0}
              stroke={palette[index]}
              strokeWidth={1.7}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
