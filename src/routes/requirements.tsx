import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/requirements")({
  component: () => <Navigate to="/blog" replace />,
});
