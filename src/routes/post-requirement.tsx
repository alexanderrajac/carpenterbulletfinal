import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/post-requirement")({
  component: () => <Navigate to="/blog" replace />,
});
