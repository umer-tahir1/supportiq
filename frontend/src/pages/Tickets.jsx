import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  formatNumber,
  LoadState,
  PageHeading,
  TicketTable,
} from "../components/Common";
import useLoad from "../hooks/useLoad";
import { getCategories, getClusters, getComplaints } from "../services/api";

export default function Tickets() {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({
    page: 1,
    search: "",
    sentiment: "",
    category: "",
    cluster: params.get("cluster") || "",
    source: params.get("source") || "",
    status: "",
    date_from: "",
    date_to: "",
  });
  const [search, setSearch] = useState("");
  const options = useLoad(async () => ({
    categories: await getCategories(),
    clusters: await getClusters(),
  }));
  const state = useLoad(
    () => getComplaints(filters),
    [JSON.stringify(filters)],
    true,
  );
  useEffect(() => {
    const timer = setTimeout(
      () => setFilters((current) => ({ ...current, search, page: 1 })),
      300,
    );
    return () => clearTimeout(timer);
  }, [search]);
  function change(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }
  return (
    <>
      <PageHeading
        eyebrow="THE COMPLETE PICTURE"
        title="Tickets"
        description="Every complaint, with the context you need to take action."
      />
      <section className="panel">
        <div className="ticket-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Search tickets"
              placeholder="Search by ticket, subject, or complaint…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <span className="filter-caption">
            <SlidersHorizontal size={15} />
            Filter your view
          </span>
        </div>
        <div className="filter-row">
          <select
            aria-label="Filter sentiment"
            value={filters.sentiment}
            onChange={(event) => change("sentiment", event.target.value)}
          >
            <option value="">All sentiments</option>
            {["Positive", "Neutral", "Negative"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <select
            aria-label="Filter category"
            value={filters.category}
            onChange={(event) => change("category", event.target.value)}
          >
            <option value="">All categories</option>
            {options.data?.categories.categories
              .filter((row) => row.name !== "Unanalyzed")
              .map((row) => (
                <option key={row.name}>{row.name}</option>
              ))}
          </select>
          <select
            aria-label="Filter cluster"
            value={filters.cluster}
            onChange={(event) => change("cluster", event.target.value)}
          >
            <option value="">All clusters</option>
            {options.data?.clusters.items.map((row) => (
              <option value={row.cluster_id} key={row.cluster_id}>
                C{row.cluster_id} · {row.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter source"
            value={filters.source}
            onChange={(event) => change("source", event.target.value)}
          >
            <option value="">All sources</option>
            <option value="historical_dataset">Historical dataset</option>
            <option value="customer_portal">Customer portal</option>
          </select>
          <select
            aria-label="Filter status"
            value={filters.status}
            onChange={(event) => change("status", event.target.value)}
          >
            <option value="">All statuses</option>
            {["Open", "In Progress", "Closed", "Unknown"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <input
            aria-label="From date"
            type="date"
            value={filters.date_from}
            onChange={(event) => change("date_from", event.target.value)}
          />
          <input
            aria-label="Through date"
            type="date"
            value={filters.date_to}
            onChange={(event) => change("date_to", event.target.value)}
          />
        </div>
        {options.error && (
          <div className="error-message">
            Filter options unavailable: {options.error}
            <button className="text-link" onClick={options.reload}>
              Retry
            </button>
          </div>
        )}
        {state.loading || state.error ? (
          <LoadState {...state} />
        ) : (
          <>
            <TicketTable items={state.data.items} />
            <div className="pagination">
              <span>
                {formatNumber(state.data.total)} tickets{" "}
                <span className="muted">
                  · Page {filters.page} of{" "}
                  {Math.max(1, Math.ceil(state.data.total / 20))}
                </span>
              </span>
              <div>
                <button
                  className="button secondary"
                  aria-label="Previous page"
                  disabled={filters.page === 1}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: current.page - 1,
                    }))
                  }
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="button secondary"
                  aria-label="Next page"
                  disabled={filters.page * 20 >= state.data.total}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: current.page + 1,
                    }))
                  }
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
