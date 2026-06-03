import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/require-auth";
import { RequireRole } from "@/components/require-role";
import { AppShell } from "@/components/app-shell";
import { HomeRedirectPage } from "@/pages/HomeRedirectPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PortfolioCockpitPage } from "@/pages/PortfolioCockpitPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { ProjectVisibilityPage } from "@/pages/ProjectVisibilityPage";
import { ProjectsListPage } from "@/pages/ProjectsListPage";
import { FeedPage } from "@/pages/FeedPage";

const STAFF: Array<"consultant" | "admin"> = ["consultant", "admin"];

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

        {/* Authenticated pages live inside the app shell (header + nav + user menu). */}
        <Route
          element={
            <RequireAuth>
              <AppShell>
                <Outlet />
              </AppShell>
            </RequireAuth>
          }
        >
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route
            path="/projects/:id/visibility"
            element={
              <RequireRole role={STAFF}>
                <ProjectVisibilityPage />
              </RequireRole>
            }
          />
          <Route
            path="/portfolio/cockpit"
            element={
              <RequireRole role={STAFF}>
                <PortfolioCockpitPage />
              </RequireRole>
            }
          />
          <Route path="/feed" element={<FeedPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
