import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/reels")({
  component: () => <Navigate to="/admin/blog" replace />,
});
