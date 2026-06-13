export function formatPrice(cents: number): string {
  if (cents === 0) return "Get Quote";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
