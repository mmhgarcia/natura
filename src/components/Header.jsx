import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header>
      <nav>
        <Link to="/">Inicio</Link> | <Link to="/about">Acerca de</Link>
      </nav>
    </header>
  );
}
