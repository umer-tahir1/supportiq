import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { PageHeading, Panel, SimilarResults } from "../components/Common";
import { findSimilarComplaints } from "../services/api";

export default function SimilarCases() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function search(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    setResult(null);
    try {
      setResult(await findSimilarComplaints(text));
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="CONTEXT FOR EVERY CONVERSATION"
        title="Similar cases"
        description="Look back at historical complaints to put new feedback in context."
      />
      <div className="similar-layout">
        <Panel
          title="What did the customer say?"
          subtitle="Paste a complaint to find its closest historical matches."
        >
          <form className="similar-form" onSubmit={search}>
            <label className="sr-only" htmlFor="similar-text">
              Complaint text
            </label>
            <textarea
              id="similar-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              minLength={3}
              maxLength={5000}
              required
              rows={7}
              placeholder="e.g. There were insects in the restaurant and the food preparation area was dirty."
            />
            <div className="example-row">
              <span>Try an example</span>
              <button
                type="button"
                onClick={() => {
                  setText(
                    "The food was spoiled and contained a foreign object.",
                  );
                  setResult(null);
                }}
              >
                Food quality
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setText(
                    "Rodents and insects near the kitchen food prep area.",
                  );
                  setResult(null);
                }}
              >
                Hygiene
                <ArrowRight size={13} />
              </button>
            </div>
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
            <button className="button primary" disabled={pending}>
              <Search size={17} />
              {pending ? "Finding matches…" : "Find similar cases"}
            </button>
          </form>
        </Panel>
        <aside className="similar-explainer">
          <span className="form-icon">
            <Search size={21} />
          </span>
          <h3>
            Similar words.
            <br />
            Useful context.
          </h3>
          <p>
            TF-IDF gives informative words more weight. Cosine similarity
            compares the resulting vectors and returns the five closest
            historical records.
          </p>
          <div className="explainer-divider" />
          <p>
            A high score means shared vocabulary. It does not prove the same
            cause, urgency, or outcome.
          </p>
          <small>
            Repeated source descriptors can produce ties. Zero-overlap records
            are not returned.
          </small>
        </aside>
      </div>
      {result && (
        <Panel
          title="Historical matches"
          subtitle={`${result.items.length} matches · ranked by cosine similarity`}
        >
          <SimilarResults items={result.items} />
        </Panel>
      )}
    </>
  );
}
