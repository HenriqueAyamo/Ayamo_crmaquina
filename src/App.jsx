import { Routes, Route } from 'react-router-dom'
import { DataProvider } from './DataContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Shell from './layout/Shell.jsx'
import Inicio from './pages/Inicio.jsx'
import Compras from './pages/Compras.jsx'
import ComprasDetalhe from './pages/ComprasDetalhe.jsx'
import DocumentoPO from './pages/compras/DocumentoPO.jsx'
import Vendas from './pages/Vendas.jsx'
import VendasDetalhe from './pages/VendasDetalhe.jsx'
import DocumentoProforma from './pages/vendas/DocumentoProforma.jsx'
import Demandas from './pages/Demandas.jsx'
import PurchaseDashboard from './pages/PurchaseDashboard.jsx'
import Claims from './pages/Claims.jsx'
import Qualifications from './pages/Qualifications.jsx'
import Freight from './pages/Freight.jsx'
import SalesRanking from './pages/SalesRanking.jsx'
import Empresas from './pages/Empresas.jsx'
import EmpresasDetalhe from './pages/EmpresasDetalhe.jsx'
import Contatos from './pages/Contatos.jsx'
import CadastrosGerais from './pages/CadastrosGerais.jsx'
import Usuarios from './pages/Usuarios.jsx'
import Documentos from './pages/Documentos.jsx'
import Settings from './pages/Settings.jsx'
import Training from './pages/Training.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/compras/:id" element={<ComprasDetalhe />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/vendas/:id" element={<VendasDetalhe />} />
            <Route path="/demandas" element={<Demandas />} />
            <Route path="/compras/painel" element={<PurchaseDashboard />} />
            <Route path="/claims" element={<Claims />} />
            <Route path="/qualificacoes" element={<Qualifications />} />
            <Route path="/freight" element={<Freight />} />
            <Route path="/vendas-ranking" element={<SalesRanking />} />
            <Route path="/empresas" element={<Empresas />} />
            <Route path="/empresas/:id" element={<EmpresasDetalhe />} />
            <Route path="/contatos" element={<Contatos />} />
            <Route path="/cadastros" element={<CadastrosGerais />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/training" element={<Training />} />
          </Route>
          <Route path="/compras/:id/po" element={<DocumentoPO />} />
          <Route path="/vendas/:id/proforma" element={<DocumentoProforma />} />
        </Routes>
      </DataProvider>
    </ErrorBoundary>
  )
}
