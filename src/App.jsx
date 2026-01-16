import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Lista from "./pages/Lista";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Panel from "./components/Panel/Panel";


import TasaBCV from "./pages/TasaBCV";

import Header from "./components/Header";
import Footer from "./components/Footer";
import GruposPage from './pages/GruposPage';
import ProductosPage from './pages/ProductosPage';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lista" element={<Lista />} />
        <Route path="/about" element={<About />} />
        <Route path="/panel" element={<Panel />} />
        <Route path="/tasabcv" element={<TasaBCV />} />
        <Route path="/adminproductos" element={<ProductosPage />} />        
        <Route path="/admingrupos" element={<GruposPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
