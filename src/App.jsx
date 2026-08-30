import { useState } from "react";
// import { Routes, Route } from "react-router-dom";
// import Home from "./pages/Home";
// import Lista from "./pages/Lista";
// import About from "./pages/About";
// import NotFound from "./pages/NotFound";
// import Panel from "./components/Panel/Panel";
// import TasaBCV from "./pages/TasaBCV";
// import Header from "./components/Header";
// import Footer from "./components/Footer";
// import GruposPage from './pages/GruposPage';
// import ProductosPage from './pages/ProductosPage';
// // Nueva importación de la página de Pedidos
// import PedidosPage from './pages/Pedidos';
// // Asegúrate de tener esto:
// import DeliveryPage from './pages/DeliveryPage';
// import Estadisticas from "./pages/Estadisticas";
// import SaboresMasVendidos from "./pages/SaboresMasVendidos";
// import ResumenInventario from "./components/ResumenInventario";
// import VentasDelDia from "./pages/VentasDelDia";
// import RegistroGasto from "./components/RegistroGasto";
// import FreezerGrid from "./components/FreezerLayout/FreezerGrid";
// import TestFinanzas from "./finanzas/testFinanzas";
import Splash from "./components/Splash";
import Main from "./components/Main";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleContinue = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash ? (
        <Splash onContinue={handleContinue} />
      ) : (
        <Main />
      )}
    </>
  );
}

export default App;