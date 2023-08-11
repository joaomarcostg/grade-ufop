export async function fetchRequest<TResponse>(
  url: string,
  config: RequestInit
): Promise<TResponse> {
  const response = await fetch(url, config);
  return await response.json();
}
