import { Info } from "lucide-react";
import { LoadState, PageHeading, Panel } from "../components/Common";
import {
  RankedBars,
  SentimentByCategory,
  SentimentChart,
  VolumeChart,
  CategoryTrendChart,
} from "../components/Charts";
import useLoad from "../hooks/useLoad";
import {
  getCategories,
  getEvaluation,
  getSentiment,
  getTrends,
} from "../services/api";

export default function Analytics() {
  const state = useLoad(
    async () => {
      const [categories, sentiment, trends, evaluation] = await Promise.all([
        getCategories(),
        getSentiment(),
        getTrends(),
        getEvaluation(),
      ]);
      return { categories, sentiment, trends, evaluation };
    },
    [],
    true,
  );
  if (state.loading || state.error) return <LoadState {...state} />;
  const { categories, sentiment, trends, evaluation } = state.data;
  return (
    <>
      <PageHeading
        eyebrow="FROM FEEDBACK TO UNDERSTANDING"
        title="Analytics"
        description="Find recurring issues, understand sentiment, and see where complaints originate."
      />
      <Panel
        title="How is complaint volume changing?"
        subtitle="Monthly counts split by historical dataset and customer portal"
      >
        <VolumeChart data={trends} split />
      </Panel>
      <Panel
        title="Which issues are changing over time?"
        subtitle="Monthly counts for the five most common derived intent categories"
      >
        <CategoryTrendChart data={trends} categories={categories.issues} />
      </Panel>
      <div className="equal-grid">
        <Panel
          title="Which issues recur most?"
          subtitle="SupportIQ-derived intent labels"
        >
          <RankedBars data={categories.issues} limit={8} />
        </Panel>
        <Panel
          title="Where are complaints concentrated?"
          subtitle="Source boroughs · no branch names are invented"
        >
          <RankedBars data={categories.locations} />
        </Panel>
      </div>
      <Panel
        title="How does sentiment vary by issue?"
        subtitle="Top seven derived intent groups · positive (green), neutral (gray), negative (clay)"
      >
        <SentimentByCategory data={sentiment.by_category} />
      </Panel>
      <div className="equal-grid">
        <Panel
          title="What do the source categories say?"
          subtitle="Original dataset category or optional customer selection"
        >
          <RankedBars data={categories.categories} />
        </Panel>
        <Panel
          title="Historical versus live submissions"
          subtitle="Record counts by origin"
        >
          <RankedBars
            data={categories.sources.map((row) => ({
              ...row,
              name:
                row.name === "historical_dataset"
                  ? "Historical NYC 311 records"
                  : "Customer portal",
            }))}
          />
        </Panel>
      </div>
      <div className="equal-grid">
        <Panel
          title="Overall sentiment"
          subtitle="Derived lexicon polarity, not customer satisfaction"
        >
          <SentimentChart data={sentiment.distribution} />
        </Panel>
        <Panel
          title="Model transparency"
          subtitle="What these predictions can and cannot tell you"
        >
          <div className="transparency">
            <Info size={20} />
            <h3>32 descriptors. One honest limitation.</h3>
            <p>
              The source contains structured food-establishment descriptors, not
              written reviews. Intent training reconstructs those descriptors.
            </p>
            {evaluation.intent && (
              <p>
                Held-out descriptor reconstruction accuracy:{" "}
                <strong>
                  {(evaluation.intent.accuracy * 100).toFixed(1)}%
                </strong>
                . Repeated texts appear across the split, so this score does not
                measure performance on new customer narratives.
              </p>
            )}
            <p>
              VADER supplies derived sentiment. No sentiment labels, business
              names, or delivery-delay labels were supplied by the dataset.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
