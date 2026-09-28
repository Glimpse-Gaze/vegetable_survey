import { Navigate, Route, Routes } from 'react-router-dom';
import { Questionnaire } from './components/Questionnaire/Questionnaire.jsx';
import { Home } from './pages/Home.jsx';
import { Results } from './pages/Results.jsx';
import './styles/questionnaire.css';
import './styles/pages.css';

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
      <Route path="/results" element={<Navigate to="/results/first-instincts" replace />} />
      <Route path="/results/:categoryId" element={<Results />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
