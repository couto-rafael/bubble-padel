import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthRequest } from "../middlewares/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /api/club/profile
router.get("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const club = await prisma.club.findUnique({
      where: { userId: req.userId },
      include: {
        instructors: { orderBy: { order: "asc" } },
      },
    });
    if (!club) return res.status(404).json({ error: "Clube não encontrado" });
    res.json({ data: club });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar perfil do clube" });
  }
});

// PATCH /api/club/profile
router.patch("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      cnpj,
      phone,
      logoUrl,
      coverUrl,
      city,
      state,
      courts,
      matchDuration,
      defaultStartTime,
      defaultEndTime,
      slogan,
      description,
      sports,
      amenities,
      businessHours,
      whatsappNumber,
      instagramUrl,
      youtubeUrl,
      twitterUrl,
      threadsUrl,
    } = req.body;

    const club = await prisma.club.update({
      where: { userId: req.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(cnpj !== undefined && { cnpj }),
        ...(phone !== undefined && { phone }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(courts !== undefined && { courts }),
        ...(matchDuration !== undefined && { matchDuration }),
        ...(defaultStartTime !== undefined && { defaultStartTime }),
        ...(defaultEndTime !== undefined && { defaultEndTime }),
        ...(slogan !== undefined && { slogan }),
        ...(description !== undefined && { description }),
        ...(sports !== undefined && { sports }),
        ...(amenities !== undefined && { amenities }),
        ...(businessHours !== undefined && { businessHours }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(instagramUrl !== undefined && { instagramUrl }),
        ...(youtubeUrl !== undefined && { youtubeUrl }),
        ...(twitterUrl !== undefined && { twitterUrl }),
        ...(threadsUrl !== undefined && { threadsUrl }),
      },
      include: { instructors: { orderBy: { order: "asc" } } },
    });

    res.json({ data: club });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar perfil do clube" });
  }
});

// POST /api/club/instructors
router.post("/instructors", requireAuth, async (req: AuthRequest, res) => {
  try {
    const club = await prisma.club.findUnique({
      where: { userId: req.userId },
    });
    if (!club) return res.status(404).json({ error: "Clube não encontrado" });
    const { name, bio, sports, photoUrl, order } = req.body;
    const instructor = await prisma.clubInstructor.create({
      data: {
        clubId: club.id,
        name,
        bio,
        sports: sports ?? [],
        photoUrl,
        order: order ?? 0,
      },
    });
    res.json({ data: instructor });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar professor" });
  }
});

// PATCH /api/club/instructors/:id
router.patch("/instructors/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, bio, sports, photoUrl, order } = req.body;
    const instructor = await prisma.clubInstructor.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(sports !== undefined && { sports }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(order !== undefined && { order }),
      },
    });
    res.json({ data: instructor });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar professor" });
  }
});

// DELETE /api/club/instructors/:id
router.delete(
  "/instructors/:id",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      await prisma.clubInstructor.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao remover professor" });
    }
  },
);

export { router as clubRoutes };

// ─── ROTAS PÚBLICAS ───────────────────────────────────────────────────────────

export const publicClubRoutes = Router();

publicClubRoutes.get("/:id", async (req, res, next) => {
  try {
    const club = await prisma.club.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        phone: true,
        logoUrl: true,
        coverUrl: true,
        slogan: true,
        description: true,
        courts: true,
        sports: true,
        amenities: true,
        businessHours: true,
        whatsappNumber: true,
        instagramUrl: true,
        youtubeUrl: true,
        twitterUrl: true,
        threadsUrl: true,
        instructors: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            bio: true,
            sports: true,
            photoUrl: true,
          },
        },
        tournaments: {
          where: {
            status: { in: ["PUBLISHED", "OPEN", "ONGOING", "COMPLETED"] },
          },
          select: {
            id: true,
            name: true,
            sport: true,
            status: true,
            startDate: true,
            endDate: true,
            categories: true,
            priceFirstCategory: true,
            _count: { select: { teams: true } },
          },
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!club) return res.status(404).json({ error: "Clube não encontrado" });
    return res.json({ data: club });
  } catch (err) {
    next(err);
  }
});
