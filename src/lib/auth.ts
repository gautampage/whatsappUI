export function redirectToSSO() {
  const returnTo = encodeURIComponent(window.location.href);
  window.location.href = `http://localhost:3001/login?redirect_uri=""`;
}

export async function validateSSOToken(token: string) {
  // Validate token with your auth server
  const res = await fetch("http://localhost:3001/validate", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Invalid token");
  return res.json(); // return user info
}
