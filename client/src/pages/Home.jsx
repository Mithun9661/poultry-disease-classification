import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="hero">
        <h1>Catch flock disease early, from a single photo.</h1>
        <p className="subtitle">
          FlockCheck screens fecal samples for Coccidiosis, Salmonella, and Newcastle disease
          using a machine learning model trained on labeled farm images — so you can act
          before an outbreak spreads.
        </p>
        <Link to={user ? "/predict" : "/register"} className="btn">
          {user ? "Scan a sample" : "Get started"}
        </Link>
      </div>

      <div className="card">
        <h3 style={{ fontSize: "1.05rem" }}>How it works</h3>
        <p style={{ marginBottom: 12 }}>
          1. Photograph a fresh dropping sample clearly, in good light.
        </p>
        <p style={{ marginBottom: 12 }}>
          2. Upload it — the model checks it against patterns learned from thousands of
          labeled farm images.
        </p>
        <p style={{ margin: 0 }}>
          3. Get an instant read with a confidence score and a suggested next step.
        </p>
      </div>
    </div>
  );
}
