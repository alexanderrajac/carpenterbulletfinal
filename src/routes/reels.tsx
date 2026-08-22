import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/reels")({
  component: () => <Navigate to="/blog" replace />,
});
