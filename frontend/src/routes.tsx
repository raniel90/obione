import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/require-auth";
import { RequireRole } from "@/components/require-role";
import { HomeRedirectPage } from "@/pages/HomeRedirectPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PortfolioCockpitPage } from "@/pages/PortfolioCockpitPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { ProjectVisibilityPage } from "@/pages/ProjectVisibilityPage";
import { ProjectsListPage } from "@/pages/ProjectsListPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomeRedirectPage />
            </RequireAuth>
          }
        />
        <Route
          path="/portfolio/cockpit"
          element={
            <RequireAuth>
              <RequireRole role={["consultant", "admin"]}>
                <PortfolioCockpitPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/projects"
          element={
            <RequireAuth>
              <ProjectsListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <RequireAuth>
              <ProjectDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/projects/:id/visibility"
          element={
            <RequireAuth>
              <RequireRole role={["consultant", "admin"]}>
                <ProjectVisibilityPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
