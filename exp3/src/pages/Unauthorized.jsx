import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="page">
      <section className="panel unauthorized">
        <h2>403 — Not permitted</h2>
        <p>Your role doesn't include the permission this route requires.</p>
        <Link className="btn btn-primary" to="/">Back to dashboard</Link>
      </section>
    </div>
  );
}
