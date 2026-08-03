import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { DataProvider } from './DataContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Shell from './layout/Shell.jsx'

const Inicio = lazy(() => import('./pages/Inicio.jsx'))
const Compras = lazy(() => import('./pages/Compras.jsx'))
const ComprasDetalhe = lazy(() => import('./pages/ComprasDetalhe.jsx'))
const DocumentoPO = lazy(() => import('./pages/compras/DocumentoPO.jsx'))
const Vendas = lazy(() => import('./pages/Vendas.jsx'))
const VendasDetalhe = lazy(() => import('./pages/VendasDetalhe.jsx'))
const DocumentoProforma = lazy(() => import('./pages/vendas/DocumentoProforma.jsx'))
const Demandas = lazy(() => import('./pages/Demandas.jsx'))
const Pendencias = lazy(() => import('./pages/Pendencias.jsx'))
const PurchaseDashboard = lazy(() => import('./pages/PurchaseDashboard.jsx'))
const Claims = lazy(() => import('./pages/Claims.jsx'))
const Qualifications = lazy(() => import('./pages/Qualifications.jsx'))
const Freight = lazy(() => import('./pages/Freight.jsx'))
const SalesRanking = lazy(() => import('./pages/SalesRanking.jsx'))
const Empresas = lazy(() => import('./pages/Empresas.jsx'))
const EmpresasDetalhe = lazy(() => import('./pages/EmpresasDetalhe.jsx'))
const Contatos = lazy(() => import('./pages/Contatos.jsx'))
const CadastrosGerais = lazy(() => import('./pages/CadastrosGerais.jsx'))
const Usuarios = lazy(() => import('./pages/Usuarios.jsx'))
const Documentos = lazy(() => import('./pages/Documentos.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const Training = lazy(() => import('./pages/Training.jsx'))
const UsoIA = lazy(() => import('./pages/UsoIA.jsx'))

function CarregandoPagina() {
  return <div className="p-8 text-sm text-ayamo-text-mut">Carregando...</div>
}

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <Suspense fallback={<CarregandoPagina />}>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<Inicio />} />
              <Route path="/compras" element={<Compras />} />
              <Route path="/compras/:id" element={<ComprasDetalhe />} />
              <Route path="/vendas" element={<Vendas />} />
              <Route path="/vendas/:id" element={<VendasDetalhe />} />
              <Route path="/demandas" element={<Demandas />} />
              <Route path="/pendencias" element={<Pendencias />} />
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
              <Route path="/uso-ia" element={<UsoIA />} />
            </Route>
            <Route path="/compras/:id/po" element={<DocumentoPO />} />
            <Route path="/vendas/:id/proforma" element={<DocumentoProforma />} />
          </Routes>
        </Suspense>
      </DataProvider>
    </ErrorBoundary>
  )
}
