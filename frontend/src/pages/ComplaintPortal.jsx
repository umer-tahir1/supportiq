import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  HeartHandshake,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { Brand } from "../components/Common";
import { submitComplaint } from "../services/api";

export default function ComplaintPortal() {
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [length, setLength] = useState(0);
  const formRef = useRef(null);
  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (!data.complaint_type) data.complaint_type = null;
    if (!data.location) data.location = null;
    try {
      setResult(await submitComplaint(data));
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="portal">
      <header className="portal-header">
        <a href="/" aria-label="UrbanBite home">
          <Brand />
        </a>
        <a className="care-link" href="#support-form">
          <MessageCircle size={16} />
          Customer care
          <span className="live-dot" />
        </a>
      </header>
      <main className="portal-main">
        <section className="portal-story">
          <div className="eyebrow">
            <span className="tiny-line" />
            WE’RE HERE TO LISTEN
          </div>
          <h1>
            Good food.
            <br />
            Better <em>experiences.</em>
          </h1>
          <p className="portal-intro">
            Every meal should make your day. If something didn’t feel right,
            tell us. We’ll help make it better.
          </p>
          <div className="food-art" aria-hidden="true">
            <div className="art-caption">
              <span>MADE WITH CARE</span>
              <Sprout size={21} />
            </div>
            <div className="plate">
              <div className="plate-inner">
                <div className="salad leaf-one" />
                <div className="salad leaf-two" />
                <div className="salad leaf-three" />
                <div className="salad leaf-four" />
                <div className="grain grain-one" />
                <div className="grain grain-two" />
                <div className="tomato tomato-one" />
                <div className="tomato tomato-two" />
                <div className="tomato tomato-three" />
                <div className="avocado avocado-one" />
                <div className="avocado avocado-two" />
                <div className="cucumber cucumber-one" />
                <div className="cucumber cucumber-two" />
                <div className="cucumber cucumber-three" />
                <div className="seed seed-one" />
                <div className="seed seed-two" />
              </div>
            </div>
            <div className="art-stamp">
              A little care.
              <br />
              <strong>A lot of flavor.</strong>
            </div>
          </div>
          <div className="care-promises">
            <div>
              <HeartHandshake size={20} />
              <span>
                <strong>Real people. Real care.</strong>
                <small>Your feedback reaches our support team.</small>
              </span>
            </div>
            <div>
              <ShieldCheck size={20} />
              <span>
                <strong>Your details stay private.</strong>
                <small>Only authorized staff can view your ticket.</small>
              </span>
            </div>
          </div>
        </section>
        <section className="complaint-card" id="support-form" ref={formRef}>
          {result ? (
            <div className="success-state" role="status">
              <span className="success-icon">
                <CheckCircle2 size={38} />
              </span>
              <div className="eyebrow">WE’VE GOT YOUR MESSAGE</div>
              <h2>Thanks for speaking up.</h2>
              <p>Your complaint has been submitted successfully.</p>
              <div className="confirmation-ticket">
                <span>Your ticket reference</span>
                <strong>{result.ticket_id}</strong>
                <small>Save this reference for your records.</small>
              </div>
              <p className="muted">
                Our team can now review your feedback and the details you
                shared.
              </p>
              <button
                className="button primary"
                onClick={() => {
                  setResult(null);
                  setLength(0);
                }}
              >
                Submit another message
                <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <>
              <div className="form-heading">
                <span className="form-icon">
                  <MessageCircle size={21} />
                </span>
                <span className="small-label">CUSTOMER SUPPORT</span>
              </div>
              <h2>Let’s make things right.</h2>
              <p className="form-description">
                Share a few details. We’ll take it from here.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    Your name<span className="required">*</span>
                    <input
                      autoComplete="name"
                      name="customer_name"
                      placeholder="Full name"
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Email address<span className="required">*</span>
                    <input
                      autoComplete="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      maxLength={254}
                    />
                  </label>
                </div>
                <div className="form-grid">
                  <label>
                    Order ID <span className="optional">(optional)</span>
                    <input
                      name="order_id"
                      placeholder="e.g. UB-1024"
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Location / branch{" "}
                    <span className="optional">(optional)</span>
                    <input
                      name="location"
                      placeholder="Where did you order?"
                      maxLength={400}
                    />
                  </label>
                </div>
                <label>
                  What’s this about?{" "}
                  <span className="optional">(optional)</span>
                  <div className="select-wrap">
                    <select name="complaint_type" defaultValue="">
                      <option value="">Select a category</option>
                      <option>Food quality</option>
                      <option>Delivery experience</option>
                      <option>Service experience</option>
                      <option>Hygiene & safety</option>
                      <option>Something else</option>
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </label>
                <label>
                  Subject<span className="required">*</span>
                  <input
                    name="subject"
                    placeholder="A short summary of what happened"
                    required
                    minLength={3}
                    maxLength={160}
                  />
                </label>
                <label>
                  Your message<span className="required">*</span>
                  <textarea
                    name="complaint_text"
                    placeholder="Tell us what happened and how we can help…"
                    rows={4}
                    required
                    minLength={15}
                    maxLength={5000}
                    onChange={(event) => setLength(event.target.value.length)}
                  />
                </label>
                <div className="field-hint">
                  <span>
                    A little detail helps us understand. At least 15 characters.
                  </span>
                  <span>{length}/5000</span>
                </div>
                {error && (
                  <div className="error-message" role="alert">
                    {error}
                  </div>
                )}
                <button
                  className="button primary submit-button"
                  disabled={pending}
                >
                  {pending ? (
                    <>
                      <LoaderCircle size={18} className="spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      Send your feedback
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
                <div className="privacy-note">
                  <LockKeyhole size={12} />
                  Your information is used to review and respond to your
                  complaint.
                </div>
              </form>
            </>
          )}
        </section>
      </main>
      <footer className="portal-footer">
        <span>
          © {new Date().getFullYear()} UrbanBite Foods{" "}
          <span className="footer-divider">/</span> A SupportIQ demo experience
        </span>
        <span>
          <Leaf size={14} />A better experience starts with listening.
        </span>
      </footer>
    </div>
  );
}
