import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="notfound-container">

      <h1>404</h1>

      <p>Oops! Page not found</p>

      <Link to="/">
        <button>Go to Home</button>
      </Link>

    </div>
  );
}