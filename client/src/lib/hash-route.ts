export type HashRoute = "home" | "schedule" | "schedule-admin";

export function routeForHash(hash: string): HashRoute {
  if (hash === "#schedule") return "schedule";
  if (hash === "#schedule/admin") return "schedule-admin";
  return "home";
}

export function goHome() {
  history.pushState(null, "", window.location.pathname);
  window.dispatchEvent(new Event("hashchange"));
}
