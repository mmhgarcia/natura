import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Lista from "./pages/Lista";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Panel from "./pages/Panel";
import AdminProductos from "./pages/AdminProductos";
import AdminGrupos from "./pages/AdminGrupos";
import Tasa from "./pages/Tasa";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lista" element={<Lista />} />
        <Route path="/about" element={<About />} />
        <Route path="/panel" element={<Panel />} />
        <Route path="/tasa" element={<Tasa />} />
        <Route path="/adminproductos" element={<AdminProductos />} />
        <Route path="/admingrupos" element={<AdminGrupos />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
