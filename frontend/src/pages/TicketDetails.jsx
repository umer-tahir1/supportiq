import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BrainCircuit, MapPin } from "lucide-react";
import {
  Badge,
  formatDate,
  LoadState,
  PageHeading,
  Panel,
  SimilarResults,
} from "../components/Common";
import useLoad from "../hooks/useLoad";
import { getComplaintById, updateTicketStatus } from "../services/api";

export default function TicketDetails() {
  const { id } = useParams();
  const state = useLoad(() => getComplaintById(id), [id]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function changeStatus(status) {
    setSaving(true);
    setError("");
    try {
      await updateTicketStatus(id, status);
      state.reload();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }
  if (state.loading || state.error) return <LoadState {...state} />;
  const ticket = state.data;
  return (
    <>
      <Link className="back-link" to="/admin/tickets">
        <ArrowLeft size={15} />
        All tickets
      </Link>
      <PageHeading
        eyebrow={`TICKET #${ticket.external_ticket_id}`}
        title={ticket.subject || ticket.complaint_text}
        description={`Created ${formatDate(ticket.created_at)} · ${ticket.source === "historical_dataset" ? "Imported historical record" : "Customer portal submission"}`}
        action={
          <label className="status-control">
            Ticket status
            <select
              aria-label="Ticket status"
              disabled={saving}
              value={ticket.status}
              onChange={(event) => changeStatus(event.target.value)}
            >
              {!["Open", "In Progress", "Closed"].includes(ticket.status) && (
                <option>{ticket.status}</option>
              )}
              <option>Open</option>
              <option>In Progress</option>
              <option>Closed</option>
            </select>
          </label>
        }
      />
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <div className="detail-grid">
        <Panel
          title={
            ticket.source === "historical_dataset"
              ? "Original problem descriptor"
              : "Customer message"
          }
          subtitle="Source-provided information"
        >
          <div className="message-body">{ticket.complaint_text}</div>
          <div className="detail-meta">
            <div>
              <span>Original category</span>
              <strong>{ticket.complaint_type || "Not provided"}</strong>
            </div>
            <div>
              <span>Location / branch</span>
              <strong>{ticket.location || "Not provided"}</strong>
            </div>
            <div>
              <span>Source</span>
              <Badge value={ticket.source} />
            </div>
            <div>
              <span>Closed date</span>
              <strong>{formatDate(ticket.closed_at)}</strong>
            </div>
            {ticket.customer_name && (
              <>
                <div>
                  <span>Customer</span>
                  <strong>{ticket.customer_name}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{ticket.email}</strong>
                </div>
                <div>
                  <span>Order reference</span>
                  <strong>{ticket.order_id || "Not provided"}</strong>
                </div>
              </>
            )}
          </div>
        </Panel>
        <Panel
          title="SupportIQ analysis"
          subtitle="Derived · review alongside the original message"
        >
          <div className="analysis-details">
            <div>
              <span>Predicted intent</span>
              <strong>{ticket.predicted_intent || "Unanalyzed"}</strong>
              <small>
                {ticket.intent_confidence === null
                  ? "Confidence unavailable"
                  : `${(ticket.intent_confidence * 100).toFixed(1)}% model probability · not calibrated`}
              </small>
            </div>
            <div>
              <span>Sentiment</span>
              <Badge value={ticket.sentiment} />
              <small>
                VADER compound: {ticket.sentiment_score ?? "Unavailable"} (−1 to
                +1)
              </small>
            </div>
            <div>
              <span>Nearest cluster</span>
              {ticket.cluster_id === null ? (
                <strong>Unassigned</strong>
              ) : (
                <Link className="text-link" to="/admin/clusters">
                  Cluster {ticket.cluster_id}
                </Link>
              )}
              <small>Based on shared words, not semantic understanding.</small>
            </div>
            {ticket.analysis_warning && (
              <p className="error-message">{ticket.analysis_warning}</p>
            )}
          </div>
        </Panel>
      </div>
      <div className="method-note">
        <BrainCircuit size={18} />
        <p>
          The classifier learned short source descriptors. Unfamiliar wording
          can return <strong>Needs review</strong>. Delivery delays are not
          represented in this historical dataset; similar cases indicate shared
          vocabulary only.
        </p>
      </div>
      <Panel
        title="Similar historical cases"
        subtitle="The five closest records by TF-IDF cosine similarity"
      >
        {ticket.similarity_available ? (
          <SimilarResults items={ticket.similar_cases} />
        ) : (
          <div className="state">
            <p>
              Similarity index is unavailable. Train and load the models to
              enable matching.
            </p>
          </div>
        )}
      </Panel>
    </>
  );
}
