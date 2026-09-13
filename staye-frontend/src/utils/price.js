export function formatPrice(amount, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateTotalCost(pricePerNight, nights) {
  return Math.max(0, pricePerNight * nights);
}
