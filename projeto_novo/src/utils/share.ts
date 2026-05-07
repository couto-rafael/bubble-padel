const PUBLIC_DOMAIN = import.meta.env.VITE_PUBLIC_DOMAIN || "bubblepadel.com";

export async function shareAthleteProfile(athlete: {
  id: string;
  fullName: string;
}): Promise<{ method: "native" | "clipboard" | "cancelled" }> {
  const url = `https://${PUBLIC_DOMAIN}/athletes/${athlete.id}`;
  const text = `Confira o perfil de ${athlete.fullName} no Bubble Padel`;

  if (navigator.share) {
    try {
      await navigator.share({ title: athlete.fullName, text, url });
      return { method: "native" };
    } catch {
      return { method: "cancelled" };
    }
  }

  await navigator.clipboard.writeText(url);
  return { method: "clipboard" };
}
