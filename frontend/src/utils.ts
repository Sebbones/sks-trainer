export function fetchApi(key: URL | string, init?: RequestInit) {
  return fetch(new URL(key, import.meta.env.VITE_API), {
    credentials: import.meta.env.PROD ? 'same-origin' : 'include',
    ...init
  });
}

export async function fetchJSON<T>(key: string): Promise<T> {
  const response = await fetchApi(key);
  return JSON.parse(await response.text());
}

export function toShuffled<T>(array: T[]) {
  const copy = [...array];
  let currentIndex = copy.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [copy[currentIndex], copy[randomIndex]] = [
      copy[randomIndex],
      copy[currentIndex]
    ];
  }

  return copy;
}
