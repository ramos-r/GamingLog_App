import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { RequireAuth } from "./components/require-auth";
import { StarDefs } from "./components/star-defs";
import { HomePage } from "./pages/home-page";
import { LoginPage } from "./pages/login-page";
import { RegisterPage } from "./pages/register-page";

// Loaded on demand so these pages don't grow the main bundle.
const PublicProfilePage = lazy(() =>
  import("./pages/public-profile-page").then((module) => ({ default: module.PublicProfilePage })),
);
const PeoplePage = lazy(() => import("./pages/people-page").then((module) => ({ default: module.PeoplePage })));

export function App() {
  return (
    <>
      <StarDefs />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<AppShell />}>
            {/* Public on purpose: a shared profile link has to work logged out. */}
            <Route path="/u/:username" element={<PublicProfilePage />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/people" element={<PeoplePage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
