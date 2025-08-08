export function normalizeURL(url: string) {
  if (url.endsWith("/")) {
    return url
  }
  return `${url}/`
}

export function fsFetch(url: string, route: string, options: RequestInit) {
  return fetch(normalizeURL(url) + route, options)
}