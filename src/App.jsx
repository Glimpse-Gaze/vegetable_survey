import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { Questionnaire } from './components/Questionnaire/Questionnaire.jsx';
import { Home } from './pages/Home.jsx';
import { Results } from './pages/Results.jsx';
import './styles/questionnaire.css';
import './styles/pages.css';

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
  );
}
