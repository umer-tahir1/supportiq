import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function useAdminShortcut() {
  const navigate = useNavigate();
  useEffect(() => {
    let armedAt = 0;
    function onKeyDown(event) {
      if (!(event.metaKey || event.ctrlKey) || event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === "a") {
        // Keep normal Select All. Only prevent default once the complete sequence fires.
        armedAt = Date.now();
      } else if (key === "b" && armedAt && Date.now() - armedAt < 1200) {
        event.preventDefault();
        armedAt = 0;
        navigate("/admin/login");
      } else {
        armedAt = 0;
      }
    }
    function reset(event) {
      if (!event.metaKey && !event.ctrlKey) armedAt = 0;
    }
    function clear() {
      armedAt = 0;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", reset);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", reset);
      window.removeEventListener("blur", clear);
    };
  }, [navigate]);
}
