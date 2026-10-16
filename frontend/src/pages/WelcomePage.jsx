import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Logo } from "../components/Brand";
import LoadingState from "../components/LoadingState";
import { markWelcomeSeen } from "../welcome";

const SERVICES = [
  {
    id: "true-cost",
    title: "True Cost",
    body: "Turn shipment paperwork into a clear per-item landed cost.",
  },
  {
    id: "modes",
    title: "Dual cost modes",
    body: "Enter Already-Local totals or Auto FX foreign invoices.",
  },
  {
    id: "pricing",
    title: "Retail suggestion",
    body: "Pick a profit margin or enter selling prices yourself before you commit.",
  },
  {
    id: "ledger",
    title: "Cost history",
    body: "Keep a short audit trail when you allocate, price, and commit a batch.",
  },
];

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="pad">
        <LoadingState
          className="loading-state--page"
          label="Opening Tranz-Algo"
          tips={["Checking your session…", "Preparing the welcome screen…"]}
        />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;

  function finish() {
    markWelcomeSeen();
    navigate("/login", { replace: true });
  }

  return (
    <div className="welcome-wrap">
      <header className="welcome-top">
        <div className="welcome-top-inner">
          <div className="brand welcome-brand">
            <Logo size={36} />
            <span>
              Tranz-Algo
              <small>Import true-cost pricing</small>
            </span>
          </div>
          <div className="welcome-top-meta">
            <button type="button" className="btn ghost welcome-top-signin" onClick={finish}>
              Sign in
            </button>
          </div>
        </div>
      </header>

      <main className="welcome-main">
        <section className="welcome-hero" aria-labelledby="welcome-hero-title">
          <div className="welcome-hero-media" aria-hidden="true">
            <img
              src="/welcome-hero.jpg"
              alt=""
              className="welcome-hero-img"
              width={1600}
              height={900}
            />
          </div>
          <div className="welcome-hero-shade" aria-hidden="true" />
          <div className="welcome-hero-content">
            <p className="welcome-hero-kicker">Landed-cost studio for importers</p>
            <h1 id="welcome-hero-title" className="welcome-hero-title">
              How can Tranz-Algo help you?
            </h1>
            <p className="welcome-hero-lead">
              Recover the true cost of imported goods, suggest safe retail prices, and track stock by
              shipment — without replacing your POS, shipper, or clearing agent.
            </p>
            <div className="welcome-hero-actions">
              <button type="button" className="btn primary" onClick={finish}>
                Get started
              </button>
              <button type="button" className="btn ghost welcome-hero-ghost" onClick={finish}>
                Sign in
              </button>
            </div>
          </div>
        </section>

        <section className="welcome-capabilities" aria-labelledby="welcome-cap-title">
          <header className="welcome-cap-head">
            <p className="welcome-cap-kicker">Core capabilities</p>
            <h2 id="welcome-cap-title">From shipment paperwork to shelf-ready price</h2>
          </header>
          <div className="welcome-services">
            {SERVICES.map((service, i) => (
              <article
                key={service.id}
                className="welcome-service"
                style={{ "--i": i }}
              >
                <h3>{service.title}</h3>
                <p>{service.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="welcome-foot">
        <div className="welcome-foot-inner">
          <div className="welcome-foot-brand">
            <Logo size={28} />
            <div>
              <strong>Tranz-Algo</strong>
              <span>True-cost inventory for importers</span>
            </div>
          </div>
          <p className="welcome-foot-copy">
            Built for import-dependent SMEs who need explainable landed cost.
          </p>
        </div>
      </footer>
    </div>
  );
}
