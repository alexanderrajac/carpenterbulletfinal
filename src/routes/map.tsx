import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/map")({
  component: () => <Navigate to="/services" replace />,
});
