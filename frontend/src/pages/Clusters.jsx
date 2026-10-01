import { Link } from "react-router-dom";
import { ArrowUpRight, Layers3 } from "lucide-react";
import {
  Empty,
  formatNumber,
  LoadState,
  PageHeading,
} from "../components/Common";
import useLoad from "../hooks/useLoad";
import { getClusters } from "../services/api";

export default function Clusters() {
  const state = useLoad(getClusters, [], true);
  if (state.loading || state.error) return <LoadState {...state} />;
  return (
    <>
      <PageHeading
        eyebrow="PATTERNS BENEATH THE SURFACE"
        title="Complaint clusters"
        description="K-Means groups complaints with similar vocabulary into recurring themes."
        action={
          <span className="button secondary">
            <Layers3 size={17} />
            {state.data.items.length} discovered groups
          </span>
        }
      />
      <div className="method-note">
        <Layers3 size={19} />
        <p>
          Names come from each cluster’s strongest TF-IDF terms. Groups are
          learned from the data and may mix different issues with overlapping
          words. Counts include imported records and assigned customer
          submissions.
        </p>
      </div>
      {!state.data.items.length && (
        <Empty
          title="No clusters available"
          text="Train the K-Means model and import records to discover complaint groups."
        />
      )}
      <div className="cluster-grid">
        {state.data.items.map((cluster) => (
          <section className="panel cluster-card" key={cluster.cluster_id}>
            <div className="cluster-top">
              <span className="cluster-number">
                C{String(cluster.cluster_id).padStart(2, "0")}
              </span>
              <span className="subtle-tag">
                {cluster.percentage}% OF ALL COMPLAINTS
              </span>
            </div>
            <h2>{cluster.name}</h2>
            <div className="cluster-count">
              {formatNumber(cluster.count)}
              <span>complaints</span>
            </div>
            <div className="cluster-progress">
              <span style={{ width: `${cluster.percentage}%` }} />
            </div>
            <div className="cluster-label">TOP KEYWORDS</div>
            <div className="keyword-list">
              {cluster.keywords.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </div>
            <div className="cluster-label">DOMINANT TRAINING DESCRIPTOR</div>
            <p>{cluster.dominant_category}</p>
            <div className="cluster-label">EXAMPLE SOURCE DESCRIPTORS</div>
            <ul>
              {cluster.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
            <Link
              className="text-link"
              to={`/admin/tickets?cluster=${cluster.cluster_id}`}
            >
              Explore these complaints
              <ArrowUpRight size={16} />
            </Link>
          </section>
        ))}
      </div>
      {!!state.data.experiments.length && (
        <details className="model-details">
          <summary>How was the number of clusters selected?</summary>
          <p>
            We tested K = 5, 8, and 10. We chose the highest silhouette score on
            unique descriptors so duplicate wording would not dominate
            evaluation. The final K-Means model was trained using all historical
            records.
          </p>
          <div className="experiment-results">
            {state.data.experiments.map((item) => (
              <span key={item.k}>
                K = {item.k}
                <strong>{item.silhouette_unique_descriptors.toFixed(3)}</strong>
                <small>silhouette score</small>
              </span>
            ))}
          </div>
          <p>
            {state.data.unassigned} records are unassigned. Scores can be modest
            because the source vocabulary is short and repetitive.
          </p>
        </details>
      )}
    </>
  );
}
