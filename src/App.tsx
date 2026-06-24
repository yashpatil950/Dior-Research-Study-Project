import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { SessionSetupPage } from "./pages/SessionSetupPage";
import { BaselinePage } from "./pages/BaselinePage";
import { PactPage } from "./pages/PactPage";
import { AdminPage } from "./pages/AdminPage";
import { RequireParticipant } from "./components/RequireParticipant";
import { AesAvatarPage } from "./pages/AesAvatarPage";
import { AesTextPage } from "./pages/AesTextPage";
import { TravelCardAPage } from "./pages/Task1Page";
import { TravelCardBPage } from "./pages/Task2Page";
import { FormEntry1Page } from "./pages/Task4Page";
import { FormEntry2Page } from "./pages/Task5Page";
import { EmailSortingAPage, EmailSortingBPage } from "./pages/EmailClassifyPage";

const Gated = ({ children }: { children: React.ReactNode }) => (
  <RequireParticipant>{children}</RequireParticipant>
);

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"               element={<LoginPage />} />
          <Route path="/session-setup"  element={<Gated><SessionSetupPage /></Gated>} />
          <Route path="/baseline/start" element={<Gated><BaselinePage phase="start" /></Gated>} />
          <Route path="/baseline/end"   element={<Gated><BaselinePage phase="end" /></Gated>} />
          <Route path="/pact"           element={<Gated><PactPage /></Gated>} />
          <Route path="/aes-avatar"     element={<Gated><AesAvatarPage /></Gated>} />
          <Route path="/aes-text"       element={<Gated><AesTextPage /></Gated>} />
          <Route path="/travel-card-a"  element={<Gated><TravelCardAPage /></Gated>} />
          <Route path="/travel-card-b"  element={<Gated><TravelCardBPage /></Gated>} />
          <Route path="/email-sorting-a" element={<Gated><EmailSortingAPage /></Gated>} />
          <Route path="/email-sorting-b" element={<Gated><EmailSortingBPage /></Gated>} />
          <Route path="/form-entry-1"   element={<Gated><FormEntry1Page /></Gated>} />
          <Route path="/form-entry-2"   element={<Gated><FormEntry2Page /></Gated>} />
          <Route path="/admin"          element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
