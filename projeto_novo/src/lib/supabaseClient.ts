const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

/** Faz upload de um arquivo via backend (que usa service_role key) e retorna a URL pública. */
export async function uploadImage(
  bucket: "avatars" | "banners",
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/upload/${bucket}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Erro no upload.");
  }

  const json = await res.json();
  return json.url as string;
}
