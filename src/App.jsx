import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Home } from './pages/Home.jsx';
import { ReportIssuesButton } from './components/ReportIssues.jsx';
import { useI18n } from './i18n/useI18n.js';
import { isLocale } from './i18n/locales.js';
import { withLocale } from './i18n/paths.js';
import './styles/questionnaire.css';
import './styles/pages.css';
import './styles/zh.css';
import './styles/scripts.css';

const Questionnaire = lazy(() =>
  import('./components/Questionnaire/Questionnaire.jsx').then((mod) => ({
    default: mod.Questionnaire,
  })),
);
const Results = lazy(() =>
  import('./pages/Results.jsx').then((mod) => ({ default: mod.Results })),
);

function RootRedirect() {
  const { locale } = useI18n();
  return <Navigate to={`/${locale}`} replace />;
}

function LocaleOutlet() {
  const { locale: param } = useParams();
  const location = useLocation();
  const { locale } = useI18n();

  if (!isLocale(param)) {
    return (
      <Navigate
        to={`${withLocale(locale, location.pathname)}${location.search}${location.hash}`}
        replace
      />
    );
  }

  const onResults = /\/results(?:\/|$)/.test(location.pathname);

  return (
    <>
      {onResults ? null : <ReportIssuesButton variant="fab" />}
      <Outlet />
    </>
  );
}

function LocaleFallback() {
  const { locale } = useParams();
  return <Navigate to={`/${locale}`} replace />;
}

function LegacyRedirect() {
  const location = useLocation();
  const { locale } = useI18n();
  return (
    <Navigate
      to={`${withLocale(locale, location.pathname)}${location.search}${location.hash}`}
      replace
    />
  );
}

function ResultsIndex() {
  const { locale } = useParams();
  const [params] = useSearchParams();
  const code = params.get('code');
  const to = withLocale(
    locale,
    code
      ? `/results/first-instincts?code=${encodeURIComponent(code)}`
      : '/results/first-instincts',
  );
  return <Navigate to={to} replace />;
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/:locale" element={<LocaleOutlet />}>
          <Route index element={<Home />} />
          <Route
            path="survey"
            element={
              <div className="app-shell">
                <Questionnaire />
              </div>
            }
          />
          <Route path="results" element={<ResultsIndex />} />
          <Route path="results/:categoryId" element={<Results />} />
          <Route path="*" element={<LocaleFallback />} />
        </Route>
        <Route path="*" element={<LegacyRedirect />} />
      </Routes>
    </Suspense>
  );
}
