import { Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/require-auth";
import { StarDefs } from "./components/star-defs";
import { HomePage } from "./pages/home-page";
import { LoginPage } from "./pages/login-page";
import { RegisterPage } from "./pages/register-page";

export function App() {
  return (
    <>
      <StarDefs />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Routes>
    </>
  );
}
