import { useEffect, useState } from "react";

export default function useLoad(loader, dependencies = [], poll = false) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    let inFlight = false;
    async function load(initial = false) {
      if (inFlight) return;
      inFlight = true;
      if (initial) setLoading(true);
      try {
        const result = await loader();
        if (active) {
          setData(result);
          setError("");
        }
      } catch (error) {
        if (active) setError(error.message);
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    }
    load(true);
    const timer = poll ? setInterval(() => load(), 15000) : null;
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [...dependencies, version]);
  return {
    data,
    error,
    loading,
    reload: () => setVersion((value) => value + 1),
  };
}
