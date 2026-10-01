import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Archive,
  CircleDot,
  Layers3,
  MessageSquare,
  RefreshCw,
  Ticket,
} from "lucide-react";
import {
  Empty,
  formatNumber,
  LoadState,
  PageHeading,
  Panel,
  TicketTable,
} from "../components/Common";
import { RankedBars, SentimentChart, VolumeChart } from "../components/Charts";
import useLoad from "../hooks/useLoad";
import {
  getCategories,
  getClusters,
  getDashboardSummary,
  getSentiment,
  getTrends,
} from "../services/api";

export default function Dashboard() {
  const state = useLoad(
    async () => {
      const [summary, trends, sentiment, categories, clusters] =
        await Promise.all([
          getDashboardSummary(),
          getTrends(),
          getSentiment(),
          getCategories(),
          getClusters(),
        ]);
      return { summary, trends, sentiment, categories, clusters };
    },
    [],
    true,
  );
  if (state.loading || state.error) return <LoadState {...state} />;
  const { summary, trends, sentiment, categories, clusters } = state.data;
  const metrics = [
    {
      title: "Total complaints",
      value: summary.total,
      note: "Across all sources",
      icon: Ticket,
    },
    {
      title: "Historical records",
      value: summary.historical,
      note: "Imported NYC 311 dataset",
      icon: Archive,
    },
    {
      title: "Customer submissions",
      value: summary.live,
      note: "Directly from your portal",
      icon: MessageSquare,
    },
    {
      title: "Open complaints",
      value: summary.open,
      note: "Open or in progress",
      icon: CircleDot,
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="YOUR CUSTOMER EXPERIENCE, AT A GLANCE"
        title="Overview"
        description="Understand the feedback. See where you can make a difference."
        action={
          <button className="button secondary" onClick={state.reload}>
            <RefreshCw size={15} />
            Refresh data
          </button>
        }
      />
      <div className="overview-note">
        <span>
          <span className="live-dot" />
          Connected to your complaint database
        </span>
        <small>All-time view · Refreshes every 15 seconds</small>
      </div>
      <div className="metrics-grid">
        {metrics.map(({ title, value, note, icon: Icon }) => (
          <section className="metric-card" key={title}>
            <div>
              <span>{title}</span>
              <Icon size={17} />
            </div>
            <strong>{formatNumber(value)}</strong>
            <small>{note}</small>
          </section>
        ))}
      </div>
      <div className="secondary-metrics">
        <div>
          <span>Negative sentiment</span>
          <strong>{summary.negative_percent}%</strong>
          <small>
            of {formatNumber(summary.sentiment_analyzed)} analyzed records
          </small>
        </div>
        <div>
          <span>Discovered clusters</span>
          <strong>{summary.clusters}</strong>
          <small>recurring complaint groups</small>
        </div>
        <div>
          <span>Avg. time to close</span>
          <strong>
            {summary.average_resolution_hours === null
              ? "—"
              : `${formatNumber(summary.average_resolution_hours)}h`}
          </strong>
          <small>
            {formatNumber(summary.resolution_sample_count)} valid date pairs
          </small>
        </div>
        <div>
          <span>Top source category</span>
          <strong className="text-metric">
            {summary.top_category || "No data"}
          </strong>
          <small>provided in the original records</small>
        </div>
      </div>
      <div className="dashboard-grid">
        <Panel
          title="Complaint volume"
          subtitle="Monthly complaints · all available dates"
          action={<span className="subtle-tag">ALL TIME</span>}
        >
          <VolumeChart data={trends} />
        </Panel>
        <Panel
          title="Sentiment breakdown"
          subtitle="Derived using VADER + restaurant phrase rules"
        >
          <SentimentChart data={sentiment.distribution} />
        </Panel>
      </div>
      <Panel
        title="Recent complaints"
        subtitle="The latest historical and customer records"
        action={
          <Link className="text-link" to="/admin/tickets">
            View all tickets
            <ArrowRight size={15} />
          </Link>
        }
      >
        <TicketTable items={summary.recent} compact />
      </Panel>
      <div className="equal-grid">
        <Panel
          title="Recurring issues"
          subtitle="SupportIQ-derived intent categories"
        >
          <RankedBars data={categories.issues} />
        </Panel>
        <Panel
          title="Complaint clusters"
          subtitle="Groups discovered from shared vocabulary"
          action={
            <Link
              className="icon-button"
              to="/admin/clusters"
              aria-label="Explore clusters"
            >
              <ArrowUpRight size={17} />
            </Link>
          }
        >
          <RankedBars
            data={clusters.items
              .map((cluster) => ({ name: cluster.name, count: cluster.count }))
              .sort((a, b) => b.count - a.count)}
          />
        </Panel>
      </div>
      <Panel
        title="Fresh from your customers"
        subtitle="Only submissions made through the customer portal"
        action={
          <Link
            className="text-link"
            to="/admin/tickets?source=customer_portal"
          >
            View submissions
            <ArrowRight size={15} />
          </Link>
        }
      >
        <TicketTable items={summary.recent_live} compact />
      </Panel>
      <Panel
        title="Negative feedback to review"
        subtitle="Sentiment is a review signal, not a severity assessment"
      >
        <TicketTable items={summary.negative_tickets} compact />
      </Panel>
      <div className="method-note">
        <Layers3 size={17} />
        <p>
          <strong>Know your data.</strong> Historical text consists of NYC 311
          problem descriptors, not customer narratives. Sentiment, intent, and
          clusters are SupportIQ-derived. Neutral sentiment does not mean a
          complaint is harmless.
        </p>
      </div>
    </>
  );
}
