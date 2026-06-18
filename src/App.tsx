import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { BaselinePage } from "./pages/BaselinePage";
import { PactPage } from "./pages/PactPage";
import { AdminPage } from "./pages/AdminPage";
import { RequireParticipant } from "./components/RequireParticipant";
import { AesAvatarPage } from "./pages/AesAvatarPage";
import { AesTextPage } from "./pages/AesTextPage";
import { Task1Page } from "./pages/Task1Page";
import { Task2Page } from "./pages/Task2Page";
import { Task4Page } from "./pages/Task4Page";
import { Task5Page } from "./pages/Task5Page";
import { Task3Page, Task6Page } from "./pages/EmailClassifyPage";

const Gated = ({ children }: { children: React.ReactNode }) => (
  <RequireParticipant>{children}</RequireParticipant>
);

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/baseline/start" element={<Gated><BaselinePage phase="start" /></Gated>} />
          <Route path="/aes-avatar"     element={<Gated><AesAvatarPage /></Gated>} />
          <Route path="/task/1"         element={<Gated><Task1Page /></Gated>} />
          <Route path="/task/2"         element={<Gated><Task2Page /></Gated>} />
          <Route path="/task/3"         element={<Gated><Task3Page /></Gated>} />
          <Route path="/pact"           element={<Gated><PactPage /></Gated>} />
          <Route path="/task/4"         element={<Gated><Task4Page /></Gated>} />
          <Route path="/task/5"         element={<Gated><Task5Page /></Gated>} />
          <Route path="/task/6"         element={<Gated><Task6Page /></Gated>} />
          <Route path="/aes-text"       element={<Gated><AesTextPage /></Gated>} />
          <Route path="/baseline/end"   element={<Gated><BaselinePage phase="end" /></Gated>} />
          <Route path="/admin"          element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
