export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;

  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const hostname = window.location.hostname;
  
  let domain = "";
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      // For allminiapps.com, root domain is allminiapps.com
      // For my.allminiapps.com, root domain is allminiapps.com
      domain = `; domain=.${parts.slice(-2).join(".")}`;
    }
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${domain}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}
