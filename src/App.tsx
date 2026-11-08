import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { I18nProvider } from "./i18n/I18nContext";
import { AppStateProvider } from "./hooks/AppState";
import { DisplaySettingsProvider } from "./hooks/DisplaySettings";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Storms from "./pages/Storms";
import AlertChecker from "./pages/AlertChecker";
import MapPage from "./pages/MapPage";
import Impact from "./pages/Impact";
import Safety from "./pages/Safety";
import Checklist from "./pages/Checklist";
import Contacts from "./pages/Contacts";
import Family from "./pages/Family";
import Guide from "./pages/Guide";
import Settings from "./pages/Settings";
import Donate from "./pages/Donate";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// HashRouter: every route is served by the same cached index.html, so navigation
// works offline and on any static host without rewrite rules.
export default function App() {
  return (
    <I18nProvider>
      <DisplaySettingsProvider>
        <AppStateProvider>
          <HashRouter>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/storms" element={<Storms />} />
                <Route path="/storms/check" element={<AlertChecker />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/impact" element={<Impact />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/safety/checklist" element={<Checklist />} />
                <Route path="/safety/contacts" element={<Contacts />} />
                <Route path="/safety/family" element={<Family />} />
                <Route path="/safety/guide" element={<Guide />} />
                <Route path="/safety/donate" element={<Donate />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </HashRouter>
        </AppStateProvider>
      </DisplaySettingsProvider>
    </I18nProvider>
  );
}
