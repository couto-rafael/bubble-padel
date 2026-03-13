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
    });

    if (!club) {
      return res.status(404).json({ error: "Clube não encontrado" });
    }

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
      city,
      state,
      courts,
      matchDuration,
      defaultStartTime,
      defaultEndTime,
    } = req.body;

    const club = await prisma.club.update({
      where: { userId: req.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(cnpj !== undefined && { cnpj }),
        ...(phone !== undefined && { phone }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(courts !== undefined && { courts }),
        ...(matchDuration !== undefined && { matchDuration }),
        ...(defaultStartTime !== undefined && { defaultStartTime }),
        ...(defaultEndTime !== undefined && { defaultEndTime }),
      },
    });

    res.json({ data: club });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar perfil do clube" });
  }
});

export { router as clubRoutes };

// ─────────────────────────────────────────────────────────────────────────────
// ROTAS PÚBLICAS
// ─────────────────────────────────────────────────────────────────────────────

export const publicClubRoutes = Router();

// GET /api/public/clubs/:id
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
        courts: true,
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
