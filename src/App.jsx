import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { Home } from './pages/Home.jsx';
import './styles/questionnaire.css';
import './styles/pages.css';

const Questionnaire = lazy(() =>
  import('./components/Questionnaire/Questionnaire.jsx').then((mod) => ({
    default: mod.Questionnaire,
  })),
);
const Results = lazy(() =>
  import('./pages/Results.jsx').then((mod) => ({ default: mod.Results })),
);

function ResultsIndex() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const to = code
    ? `/results/first-instincts?code=${encodeURIComponent(code)}`
    : '/results/first-instincts';
  return <Navigate to={to} replace />;
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/survey"
          element={
            <div className="app-shell">
              <Questionnaire />
            </div>
          }
        />
        <Route path="/results" element={<ResultsIndex />} />
        <Route path="/results/:categoryId" element={<Results />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
