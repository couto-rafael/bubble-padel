import { prisma } from "./prisma";

export async function areFriends(a: string, b: string): Promise<boolean> {
  if (!a || !b || a === b) return false;
  const f = await prisma.athleteFriendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: a, receiverId: b },
        { senderId: b, receiverId: a },
      ],
    },
    select: { id: true },
  });
  return !!f;
}
