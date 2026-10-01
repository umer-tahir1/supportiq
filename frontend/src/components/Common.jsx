import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Inbox,
  LoaderCircle,
  RefreshCw,
  Sprout,
  Waves,
} from "lucide-react";

export function Brand({ admin = false }) {
  return (
    <div className="brand">
      <span className="brand-icon">
        {admin ? <Waves size={22} /> : <Sprout size={23} />}
      </span>
      <span>
        {admin ? "SupportIQ" : "urbanbite"}
        {!admin && <small>FOOD, WITH FEELING.</small>}
      </span>
      {admin && <span className="workspace-tag">WORKSPACE</span>}
    </div>
  );
}

export function Badge({ value }) {
  const style =
    {
      Negative: "red",
      Positive: "green",
      Neutral: "gray",
      Open: "blue",
      "In Progress": "amber",
      Closed: "green",
      customer_portal: "blue",
      historical_dataset: "gray",
    }[value] || "gray";
  const label =
    { customer_portal: "Customer portal", historical_dataset: "Historical" }[
      value
    ] ||
    value ||
    "Unanalyzed";
  return (
    <span className={`badge ${style}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function LoadState({ loading, error, reload }) {
  if (loading)
    return (
      <div className="state" role="status">
        <LoaderCircle className="spin" />
        <h3>Loading your workspace</h3>
        <p>Gathering the latest complaint data.</p>
      </div>
    );
  if (error)
    return (
      <div className="state" role="alert">
        <Inbox />
        <h3>We couldn’t load this data</h3>
        <p>{error}</p>
        <button className="button secondary" onClick={reload}>
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    );
  return null;
}

export function Empty({
  title = "Nothing here yet",
  text = "New complaints will appear here once they are submitted.",
}) {
  return (
    <div className="state compact">
      <Inbox size={25} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export const formatNumber = (number) =>
  new Intl.NumberFormat("en-US").format(number ?? 0);
export const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not available";

export function TicketTable({ items = [], compact = false }) {
  if (!items.length) return <Empty />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ticket / complaint</th>
            {!compact && <th>Category / intent</th>}
            <th>Sentiment</th>
            <th>Source</th>
            <th>Status</th>
            {!compact && (
              <>
                <th>Cluster</th>
                <th>Created</th>
              </>
            )}
            <th>
              <span className="sr-only">View</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <Link
                  className="ticket-link"
                  to={`/admin/tickets/${ticket.external_ticket_id}`}
                >
                  <span className="ticket-id">
                    #{ticket.external_ticket_id}
                  </span>
                  <strong>{ticket.subject || ticket.complaint_text}</strong>
                </Link>
                {ticket.subject && (
                  <span className="table-excerpt">{ticket.complaint_text}</span>
                )}
              </td>
              {!compact && (
                <td>
                  <span className="cell-label">
                    {ticket.complaint_type || "Not provided"}
                  </span>
                  <span className="muted">
                    {ticket.predicted_intent || "Unanalyzed"}
                  </span>
                </td>
              )}
              <td>
                <Badge value={ticket.sentiment} />
              </td>
              <td>
                <Badge value={ticket.source} />
              </td>
              <td>
                <Badge value={ticket.status} />
              </td>
              {!compact && (
                <>
                  <td>
                    {ticket.cluster_id === null ? "—" : `C${ticket.cluster_id}`}
                  </td>
                  <td className="nowrap">{formatDate(ticket.created_at)}</td>
                </>
              )}
              <td>
                <Link
                  className="icon-button"
                  aria-label={`Open ticket ${ticket.external_ticket_id}`}
                  to={`/admin/tickets/${ticket.external_ticket_id}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SimilarResults({ items }) {
  if (!items.length)
    return (
      <Empty
        title="No matching historical cases"
        text="No shared terms were found. Try wording closer to a food safety or hygiene issue."
      />
    );
  return (
    <div className="similar-results">
      {items.map((item, index) => (
        <Link
          className="similar-result"
          to={`/admin/tickets/${item.ticket_id}`}
          key={item.ticket_id}
        >
          <span className="result-index">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <span className="ticket-id">#{item.ticket_id}</span>
            <h3>{item.complaint_text}</h3>
            <p>{item.complaint_category}</p>
          </div>
          <div className="similarity">
            <strong>{item.similarity}%</strong>
            <span>text similarity</span>
          </div>
          <ArrowUpRight size={18} />
        </Link>
      ))}
    </div>
  );
}
