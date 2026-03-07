import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "./DashboardHeader";
import { useTournaments, useClub } from "./hooks";

// ─── tipos ────────────────────────────────────────────────
type Step =
  | "informacoes"
  | "financeiro"
  | "estrutura"
  | "categorias"
  | "imagens"
  | "regras"
  | "transmissao";

interface DaySchedule {
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
}

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
}

interface Sponsor {
  id: string;
  name: string;
  image: File | null;
}

interface PaymentMethod {
  pix: boolean;
  boleto: boolean;
  creditCard: boolean;
  debitCard: boolean;
}

interface TournamentForm {
  // Informações Essenciais
  sport: "Padel" | "Beach Tennis" | "Tenis" | "Pickleball";
  tournamentType:
    | "Regular (Grupo + Playoffs)"
    | "Eliminatorias Diretas"
    | "Super 8";
  name: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  description: string;
  hasLimit: boolean;
  maxTeams: string;
  schedules: DaySchedule[];

  // Financeiro
  priceFirstCategory: string;
  hasSecondCategoryPrice: boolean;
  priceSecondCategory: string;
  pixKey: string;
  paymentMethods: PaymentMethod;
  wantsCoupon: boolean;
  coupons: Coupon[];

  // Estrutura
  clubSede: string;
  hasSubSede: boolean;
  subSedeName: string;
  courts: string[];
  matchDuration: string;

  // Categorias
  selectedCategories: string[];

  // Imagens
  profileImage: File | null;
  sponsors: Sponsor[];

  // Transmissão
  streamingLinks: Record<string, string>; // { courtName: youtubeLink }
}

// ─── dados iniciais ───────────────────────────────────────
const INITIAL_FORM: TournamentForm = {
  sport: "Padel",
  tournamentType: "Regular (Grupo + Playoffs)",
  name: "",
  startDate: "",
  endDate: "",
  registrationStartDate: "",
  registrationEndDate: "",
  description: "",
  hasLimit: false,
  maxTeams: "",
  schedules: [],

  // Financeiro
  priceFirstCategory: "0.00",
  hasSecondCategoryPrice: false,
  priceSecondCategory: "0.00",
  pixKey: "",
  paymentMethods: {
    pix: false,
    boleto: false,
    creditCard: false,
    debitCard: false,
  },
  wantsCoupon: false,
  coupons: [],

  // Estrutura
  clubSede: "",
  hasSubSede: false,
  subSedeName: "",
  courts: [],
  matchDuration: "90",

  // Categorias
  selectedCategories: [],

  // Imagens
  profileImage: null,
  sponsors: [],

  // Transmissão
  streamingLinks: {},
};

// Lista de categorias disponíveis
const AVAILABLE_CATEGORIES = [
  "Open Masculina",
  "Open Feminina",
  "2ª Masc",
  "2ª Fem",
  "3ª Masc",
  "3ª Fem",
  "4ª Masc",
  "4ª Fem",
  "5ª Masc",
  "5ª Fem",
  "6ª Masc",
  "6ª Fem",
  "7ª Masc",
  "7ª Fem",
  "Mista A",
  "Mista B",
  "Mista C",
  "Mista D",
];

const STEPS: { key: Step; label: string; icon: string }[] = [
  {
    key: "informacoes",
    label: "Informações Essenciais",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    key: "financeiro",
    label: "Financeiro",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H9a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    key: "estrutura",
    label: "Estrutura",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    key: "categorias",
    label: "Categorias",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    key: "imagens",
    label: "Imagens",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    key: "regras",
    label: "Regras",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    key: "transmissao",
    label: "Transmissão",
    icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  },
];

// ─── helper: gerar dias entre datas ──────────────────────
const generateDaysBetween = (start: string, end: string): DaySchedule[] => {
  if (!start || !end) return [];

  // Parse das datas sem timezone issues
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);

  const startDate = new Date(startYear, startMonth - 1, startDay);
  const endDate = new Date(endYear, endMonth - 1, endDay);
  const days: DaySchedule[] = [];

  const weekDays = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const dayName = weekDays[currentDate.getDay()];
    const formattedDate = `${day}/${month}`;

    days.push({
      date: dateStr,
      dayName: `${dayName}, ${formattedDate}`,
      startTime: "08:00",
      endTime: "18:00",
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};

// ─── componente principal ─────────────────────────────────
const CreateTournament = () => {
  const navigate = useNavigate();
  const { createTournament } = useTournaments();
  const { club, isProfileComplete, loading: clubLoading } = useClub();
  const [currentStep, setCurrentStep] = useState<Step>("informacoes");
  const [form, setForm] = useState<TournamentForm>(INITIAL_FORM);

  // Pre-fill courts and times from club profile
  useEffect(() => {
    if (!club) return;
    setForm((prev) => ({
      ...prev,
      courts: club.courts?.length > 0 ? [...club.courts] : prev.courts,
      matchDuration: club.matchDuration
        ? String(club.matchDuration)
        : prev.matchDuration,
      clubSede: club.name || prev.clubSede,
      schedules: prev.schedules.map((s) => ({
        ...s,
        startTime: club.defaultStartTime || s.startTime,
        endTime: club.defaultEndTime || s.endTime,
      })),
    }));
  }, [club]);
  const [dateErrors, setDateErrors] = useState({
    registrationStartDate: "",
    registrationEndDate: "",
    startDate: "",
    endDate: "",
  });
  const [singleDay, setSingleDay] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState("");
  const [newCouponType, setNewCouponType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Validar datas
  const validateDates = (
    registrationStart: string,
    registrationEnd: string,
    tournamentStart: string,
    tournamentEnd: string,
  ) => {
    const errors = {
      registrationStartDate: "",
      registrationEndDate: "",
      startDate: "",
      endDate: "",
    };

    // Validar se fim das inscrições é depois do início
    if (registrationStart && registrationEnd) {
      if (new Date(registrationEnd) <= new Date(registrationStart)) {
        errors.registrationEndDate =
          "Fim das inscrições deve ser depois do início";
      }
    }

    // Validar se fim das inscrições é ANTES do início do torneio
    if (registrationEnd && tournamentStart) {
      if (new Date(registrationEnd) >= new Date(tournamentStart)) {
        errors.registrationEndDate =
          "Inscrições devem terminar antes do início do torneio";
      }
    }

    // Validar se início do torneio é antes do fim (datas iguais = torneio 1 dia, OK)
    if (tournamentStart && tournamentEnd) {
      if (new Date(tournamentEnd) < new Date(tournamentStart)) {
        errors.endDate = "Data fim deve ser depois da data início";
      }
    }

    // Validar se início das inscrições é antes do torneio
    if (registrationStart && tournamentStart) {
      if (new Date(registrationStart) >= new Date(tournamentStart)) {
        errors.registrationStartDate =
          "Inscrições devem começar antes do torneio";
      }
    }

    setDateErrors(errors);
    return Object.values(errors).every((error) => error === "");
  };

  const handleChange = (field: keyof TournamentForm, value: any) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };

      // Validar datas quando alguma delas mudar
      if (
        field === "registrationStartDate" ||
        field === "registrationEndDate" ||
        field === "startDate" ||
        field === "endDate"
      ) {
        validateDates(
          updated.registrationStartDate,
          updated.registrationEndDate,
          updated.startDate,
          updated.endDate,
        );
      }

      return updated;
    });
  };

  const handlePaymentMethodToggle = (method: keyof PaymentMethod) => {
    setForm((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: !prev.paymentMethods[method],
      },
    }));
  };

  const handleAddCoupon = () => {
    if (!newCouponCode || !newCouponDiscount) return;

    const newCoupon: Coupon = {
      id: Date.now().toString(),
      code: newCouponCode.toUpperCase(),
      discount: parseFloat(newCouponDiscount),
      type: newCouponType,
    };

    setForm((prev) => ({
      ...prev,
      coupons: [...prev.coupons, newCoupon],
    }));

    setNewCouponCode("");
    setNewCouponDiscount("");
  };

  const handleRemoveCoupon = (id: string) => {
    setForm((prev) => ({
      ...prev,
      coupons: prev.coupons.filter((c) => c.id !== id),
    }));
  };

  const handleAddCourt = () => {
    setForm((prev) => ({
      ...prev,
      courts: [...prev.courts, `Quadra ${prev.courts.length + 1}`],
    }));
  };

  const handleRemoveCourt = (index: number) => {
    setForm((prev) => ({
      ...prev,
      courts: prev.courts.filter((_, i) => i !== index),
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setForm((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter((c) => c !== category)
        : [...prev.selectedCategories, category],
    }));
  };

  const handleSelectAllCategories = () => {
    setForm((prev) => ({
      ...prev,
      selectedCategories: AVAILABLE_CATEGORIES,
    }));
  };

  const handleDeselectAllCategories = () => {
    setForm((prev) => ({
      ...prev,
      selectedCategories: [],
    }));
  };

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;

    // Adicionar à lista global e marcar como selecionada
    AVAILABLE_CATEGORIES.push(newCategoryName.trim());
    setForm((prev) => ({
      ...prev,
      selectedCategories: [...prev.selectedCategories, newCategoryName.trim()],
    }));

    setNewCategoryName("");
    setShowAddCategory(false);
  };

  const handleAddSponsor = () => {
    setForm((prev) => ({
      ...prev,
      sponsors: [
        ...prev.sponsors,
        { id: Date.now().toString(), name: "", image: null },
      ],
    }));
  };

  const handleRemoveSponsor = (id: string) => {
    setForm((prev) => ({
      ...prev,
      sponsors: prev.sponsors.filter((s) => s.id !== id),
    }));
  };

  const handleSponsorNameChange = (id: string, name: string) => {
    setForm((prev) => ({
      ...prev,
      sponsors: prev.sponsors.map((s) => (s.id === id ? { ...s, name } : s)),
    }));
  };

  const handleSponsorImageChange = (id: string, file: File) => {
    setForm((prev) => ({
      ...prev,
      sponsors: prev.sponsors.map((s) =>
        s.id === id ? { ...s, image: file } : s,
      ),
    }));
  };

  const formatPixCNPJ = (value: string): string => {
    // Remove tudo que não for dígito
    const digits = value.replace(/\D/g, "").slice(0, 14);
    // Aplica máscara XX.XXX.XXX/XXXX-XX
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const handleStreamingLinkChange = (courtName: string, link: string) => {
    setForm((prev) => ({
      ...prev,
      streamingLinks: {
        ...prev.streamingLinks,
        [courtName]: link,
      },
    }));
  };

  // Cálculo de taxas por método de pagamento (valores mock - serão configurados depois)
  const calculateFees = () => {
    const price = parseFloat(form.priceFirstCategory) || 0;

    return {
      pix: {
        name: "PIX",
        inscricao: price,
        asaasFee: price * 0.0199, // 1.99% (exemplo)
        bubbleFee: 0,
        clubReceives: price - price * 0.0199,
      },
      boleto: {
        name: "Boleto",
        inscricao: price,
        asaasFee: price * 0.0399, // 3.99% (exemplo)
        bubbleFee: 0,
        clubReceives: price - price * 0.0399,
      },
      creditCard: {
        name: "Cartão de Crédito",
        inscricao: price,
        asaasFee: price * 0.0499, // 4.99% (exemplo)
        bubbleFee: 0,
        clubReceives: price - price * 0.0499,
      },
      debitCard: {
        name: "Cartão de Débito",
        inscricao: price,
        asaasFee: price * 0.0299, // 2.99% (exemplo)
        bubbleFee: 0,
        clubReceives: price - price * 0.0299,
      },
    };
  };

  const getSelectedPaymentMethods = () => {
    const fees = calculateFees();
    const methods: Array<{ key: keyof PaymentMethod; data: typeof fees.pix }> =
      [];

    if (form.paymentMethods.pix) methods.push({ key: "pix", data: fees.pix });
    if (form.paymentMethods.boleto)
      methods.push({ key: "boleto", data: fees.boleto });
    if (form.paymentMethods.creditCard)
      methods.push({ key: "creditCard", data: fees.creditCard });
    if (form.paymentMethods.debitCard)
      methods.push({ key: "debitCard", data: fees.debitCard });

    return methods;
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    const updated = { ...form, [field]: value };

    // Se torneio de 1 dia, endDate sempre = startDate
    if (singleDay && field === "startDate") {
      updated.endDate = value;
    }

    // Regenerar horários quando ambas as datas estão definidas
    if (updated.startDate && updated.endDate) {
      updated.schedules = generateDaysBetween(
        updated.startDate,
        updated.endDate,
      );
    }

    // Validar datas
    validateDates(
      form.registrationStartDate,
      form.registrationEndDate,
      updated.startDate,
      updated.endDate,
    );

    setForm(updated);
  };

  const handleScheduleChange = (
    index: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    const newSchedules = [...form.schedules];
    newSchedules[index][field] = value;
    setForm((prev) => ({ ...prev, schedules: newSchedules }));
  };

  const handleRemoveDay = (index: number) => {
    const newSchedules = form.schedules.filter((_, idx) => idx !== index);
    setForm((prev) => ({ ...prev, schedules: newSchedules }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d]/g, "");

    if (value === "") {
      setForm((prev) => ({ ...prev, price: "0.00" }));
      return;
    }

    // Converter para centavos e depois para formato decimal
    const cents = parseInt(value);
    const formatted = (cents / 100).toFixed(2);
    setForm((prev) => ({ ...prev, price: formatted }));
  };

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(STEPS[currentStepIndex + 1].key);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1].key);
    }
  };

  const handleSubmit = async () => {
    // Validar campos obrigatórios
    const errors: string[] = [];

    if (!form.name.trim()) errors.push("Nome do torneio é obrigatório");
    if (!form.startDate) errors.push("Data de início é obrigatória");
    if (!singleDay && !form.endDate) errors.push("Data de fim é obrigatória");
    if (!form.registrationStartDate)
      errors.push("Data de início das inscrições é obrigatória");
    if (!form.registrationEndDate)
      errors.push("Data de fim das inscrições é obrigatória");
    if (Object.values(dateErrors).some((e) => e !== ""))
      errors.push("Corrija os erros nas datas antes de continuar");
    if (form.selectedCategories.length === 0)
      errors.push("Selecione pelo menos uma categoria");
    if (!form.pixKey.trim()) errors.push("Chave PIX é obrigatória");
    if (!form.clubSede.trim()) errors.push("Clube sede é obrigatório");
    if (form.courts.length === 0) errors.push("Adicione pelo menos uma quadra");

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    try {
      setIsSubmitting(true);

      const sportMap: Record<string, string> = {
        Padel: "PADEL",
        "Beach Tennis": "BEACH_TENNIS",
        Tenis: "TENIS",
        Pickleball: "PICKLEBALL",
      };

      await createTournament({
        name: form.name,
        sport: sportMap[form.sport] as any,
        tournamentType: form.tournamentType,
        startDate: form.startDate,
        endDate: form.endDate,
        registrationStartDate: form.registrationStartDate,
        registrationEndDate: form.registrationEndDate,
        description: form.description,
        maxTeams: form.hasLimit ? parseInt(form.maxTeams) : 999,
        priceFirstCategory: parseFloat(form.priceFirstCategory),
        hasSecondCategoryPrice: form.hasSecondCategoryPrice,
        priceSecondCategory: parseFloat(form.priceSecondCategory),
        pixKey: form.pixKey,
        clubSede: form.clubSede,
        categories: form.selectedCategories,
        courts: form.courts,
      });

      navigate("/dashboard/tournaments");
    } catch (error: any) {
      setValidationErrors([
        error.message ?? "Erro ao criar torneio. Tente novamente.",
      ]);
      setShowValidationModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Block if club profile is incomplete
  if (!clubLoading && !isProfileComplete) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <DashboardHeader activePage="tournaments" />
        <main className="pt-20 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.193 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Complete seu perfil antes de criar torneios
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Você precisa cadastrar pelo menos <strong>uma quadra</strong> no
              seu perfil de clube. As quadras serão pré-preenchidas
              automaticamente em cada torneio.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Voltar ao Dashboard
              </button>
              <button
                onClick={() => navigate("/dashboard/settings?welcome=true")}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Completar Perfil
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <DashboardHeader activePage="tournaments" />

      <main className="pt-20 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Criar Torneio</h1>
            <p className="text-gray-500 mt-1">
              Configure todos os detalhes do seu novo torneio
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar com steps */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl p-6 lg:sticky lg:top-24">
                <nav className="space-y-2">
                  {STEPS.map((step, idx) => (
                    <button
                      key={step.key}
                      onClick={() => setCurrentStep(step.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        currentStep === step.key
                          ? "bg-blue-600/20 text-blue-600 border-l-4 border-blue-600"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-l-4 border-transparent"
                      }`}
                    >
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={step.icon}
                        />
                      </svg>
                      <span className="flex-1 text-left">{step.label}</span>
                      {idx < currentStepIndex && (
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Conteúdo principal */}
            <div className="flex-1 min-w-0">
              <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
                {/* ─── STEP 1: INFORMAÇÕES ESSENCIAIS ─── */}
                {currentStep === "informacoes" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Informações Essenciais
                    </h2>

                    {/* Esporte e Tipo de Torneio */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-2 font-medium">
                          Esporte <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={form.sport}
                          onChange={(e) =>
                            handleChange("sport", e.target.value)
                          }
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        >
                          <option value="Padel">Padel</option>
                          <option value="Beach Tennis">Beach Tennis</option>
                          <option value="Tenis">Tenis</option>
                          <option value="Pickleball">Pickleball</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-500 mb-2 font-medium">
                          Tipo de Torneio{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={form.tournamentType}
                          onChange={(e) =>
                            handleChange("tournamentType", e.target.value)
                          }
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        >
                          <option value="Regular (Grupo + Playoffs)">
                            Regular (Grupo + Playoffs)
                          </option>
                          <option value="Eliminatorias Diretas">
                            Eliminatorias Diretas
                          </option>
                          <option value="Super 8">Super 8</option>
                        </select>
                      </div>
                    </div>

                    {/* Nome do Torneio */}
                    <div>
                      <label className="block text-sm text-gray-500 mb-2 font-medium">
                        Nome do Torneio <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Digite o nome do torneio"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Datas de Inscrição */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-2 font-medium">
                          Início das Inscrições{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          value={form.registrationStartDate}
                          onChange={(e) =>
                            handleChange(
                              "registrationStartDate",
                              e.target.value,
                            )
                          }
                          onClick={(e) => e.currentTarget.showPicker?.()}
                          className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all cursor-pointer ${
                            dateErrors.registrationStartDate
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          }`}
                        />
                        {dateErrors.registrationStartDate ? (
                          <p className="text-xs text-red-600 mt-1.5 font-medium">
                            ⚠️ {dateErrors.registrationStartDate}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1.5">
                            Quando as inscrições começam a ser aceitas
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm text-gray-500 mb-2 font-medium">
                          Fim das Inscrições{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          value={form.registrationEndDate}
                          onChange={(e) =>
                            handleChange("registrationEndDate", e.target.value)
                          }
                          onClick={(e) => e.currentTarget.showPicker?.()}
                          className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all cursor-pointer ${
                            dateErrors.registrationEndDate
                              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          }`}
                        />
                        {dateErrors.registrationEndDate ? (
                          <p className="text-xs text-red-600 mt-1.5 font-medium">
                            ⚠️ {dateErrors.registrationEndDate}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1.5">
                            Deve ser antes do início do torneio
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Datas do Torneio */}
                    <div>
                      {/* Toggle 1 dia */}
                      <label className="flex items-center gap-3 mb-4 cursor-pointer w-fit">
                        <div
                          onClick={() => {
                            const next = !singleDay;
                            setSingleDay(next);
                            if (next && form.startDate) {
                              handleDateChange("startDate", form.startDate);
                            }
                          }}
                          className={`relative w-10 h-5 rounded-full transition-colors ${singleDay ? "bg-blue-600" : "bg-gray-300"}`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${singleDay ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Torneio de 1 dia
                        </span>
                      </label>

                      <div
                        className={`grid gap-4 ${singleDay ? "grid-cols-1 sm:grid-cols-1 max-w-xs" : "grid-cols-1 sm:grid-cols-2"}`}
                      >
                        <div>
                          <label className="block text-sm text-gray-500 mb-2 font-medium">
                            {singleDay ? "Data do Torneio" : "Data Início"}{" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="date"
                            value={form.startDate}
                            onChange={(e) =>
                              handleDateChange("startDate", e.target.value)
                            }
                            onClick={(e) => e.currentTarget.showPicker?.()}
                            className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all cursor-pointer ${
                              dateErrors.startDate
                                ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            }`}
                          />
                          {dateErrors.startDate && (
                            <p className="text-xs text-red-600 mt-1.5 font-medium">
                              ⚠️ {dateErrors.startDate}
                            </p>
                          )}
                        </div>

                        {!singleDay && (
                          <div>
                            <label className="block text-sm text-gray-500 mb-2 font-medium">
                              Data Fim <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="date"
                              value={form.endDate}
                              onChange={(e) =>
                                handleDateChange("endDate", e.target.value)
                              }
                              onClick={(e) => e.currentTarget.showPicker?.()}
                              className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all cursor-pointer ${
                                dateErrors.endDate
                                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                  : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              }`}
                            />
                            {dateErrors.endDate && (
                              <p className="text-xs text-red-600 mt-1.5 font-medium">
                                ⚠️ {dateErrors.endDate}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Horários por Dia */}
                    {form.schedules.length > 0 && (
                      <div>
                        <label className="block text-sm text-gray-500 mb-3 font-medium">
                          Horários por Dia
                        </label>
                        <div className="space-y-3">
                          {form.schedules.map((schedule, idx) => (
                            <div
                              key={idx}
                              className="bg-emerald-50 border border-blue-600/20 rounded-lg p-4"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
                                    <span className="text-sm text-gray-900 font-medium flex-shrink-0 min-w-[140px]">
                                      {schedule.dayName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <svg
                                        className="w-4 h-4 text-blue-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <input
                                        type="time"
                                        value={schedule.startTime}
                                        onChange={(e) =>
                                          handleScheduleChange(
                                            idx,
                                            "startTime",
                                            e.target.value,
                                          )
                                        }
                                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                    <span className="text-gray-500">até</span>
                                    <div className="flex items-center gap-2">
                                      <svg
                                        className="w-4 h-4 text-blue-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <input
                                        type="time"
                                        value={schedule.endTime}
                                        onChange={(e) =>
                                          handleScheduleChange(
                                            idx,
                                            "endTime",
                                            e.target.value,
                                          )
                                        }
                                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Botão de excluir dia */}
                                <button
                                  onClick={() => handleRemoveDay(idx)}
                                  className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-lg transition-all flex-shrink-0"
                                  title="Remover este dia"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Descrição */}
                    <div>
                      <label className="block text-sm text-gray-500 mb-2 font-medium">
                        Descrição do Torneio
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Descreva o torneio, regras especiais, premiação, etc."
                        value={form.description}
                        onChange={(e) =>
                          handleChange("description", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                      />
                    </div>

                    {/* Limite de Inscritos */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.hasLimit}
                          onChange={(e) =>
                            handleChange("hasLimit", e.target.checked)
                          }
                          className="w-5 h-5 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-900 font-medium">
                          Limite de Inscritos?
                        </span>
                      </label>

                      {form.hasLimit && (
                        <div className="mt-4">
                          <label className="block text-sm text-gray-500 mb-2 font-medium">
                            Número máximo de duplas
                          </label>
                          <input
                            type="number"
                            placeholder="Ex: 64"
                            value={form.maxTeams}
                            onChange={(e) =>
                              handleChange("maxTeams", e.target.value)
                            }
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── STEP 2: FINANCEIRO ─── */}
                {currentStep === "financeiro" && (
                  <div className="space-y-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">
                      Financeiro
                    </h2>

                    {/* Valores de Inscrição */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-2 font-medium">
                          Valor Inscrição - Primeira Categoria{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                            R$
                          </span>
                          <input
                            type="text"
                            placeholder="0,00"
                            value={form.priceFirstCategory.replace(".", ",")}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^\d]/g, "");
                              if (value === "") {
                                handleChange("priceFirstCategory", "0.00");
                                return;
                              }
                              const cents = parseInt(value);
                              const formatted = (cents / 100).toFixed(2);
                              handleChange("priceFirstCategory", formatted);
                            }}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Segunda Categoria */}
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer mb-3">
                          <input
                            type="checkbox"
                            checked={form.hasSecondCategoryPrice}
                            onChange={(e) =>
                              handleChange(
                                "hasSecondCategoryPrice",
                                e.target.checked,
                              )
                            }
                            className="w-5 h-5 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-900 font-medium">
                            Adicionar valor para segunda categoria
                          </span>
                        </label>

                        {form.hasSecondCategoryPrice && (
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                              R$
                            </span>
                            <input
                              type="text"
                              placeholder="0,00"
                              value={form.priceSecondCategory.replace(".", ",")}
                              onChange={(e) => {
                                let value = e.target.value.replace(
                                  /[^\d]/g,
                                  "",
                                );
                                if (value === "") {
                                  handleChange("priceSecondCategory", "0.00");
                                  return;
                                }
                                const cents = parseInt(value);
                                const formatted = (cents / 100).toFixed(2);
                                handleChange("priceSecondCategory", formatted);
                              }}
                              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chave PIX */}
                    <div>
                      <label className="block text-sm text-gray-500 mb-2 font-medium">
                        Chave PIX{" "}
                        <span className="text-gray-500 text-xs">
                          (Configurada nas Configurações do Clube)
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="XX.XXX.XXX/XXXX-XX"
                        value={form.pixKey}
                        onChange={(e) =>
                          handleChange("pixKey", formatPixCNPJ(e.target.value))
                        }
                        maxLength={18}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Métodos de Pagamento */}
                    <div>
                      <label className="block text-sm text-gray-500 mb-3 font-medium">
                        Formas de Pagamento Aceitas{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          {
                            key: "pix" as const,
                            label: "PIX",
                            icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                          },
                          {
                            key: "boleto" as const,
                            label: "Boleto",
                            icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                          },
                          {
                            key: "creditCard" as const,
                            label: "Cartão de Crédito",
                            icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H9a3 3 0 00-3 3v8a3 3 0 003 3z",
                          },
                          {
                            key: "debitCard" as const,
                            label: "Cartão de Débito",
                            icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H9a3 3 0 00-3 3v8a3 3 0 003 3z",
                          },
                        ].map(({ key, label, icon }) => (
                          <label
                            key={key}
                            className={`flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                              form.paymentMethods[key]
                                ? "bg-blue-50 border-emerald-200"
                                : "bg-white border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={form.paymentMethods[key]}
                              onChange={() => handlePaymentMethodToggle(key)}
                              className="w-5 h-5 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                            />
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={icon}
                              />
                            </svg>
                            <span className="text-sm text-gray-900 font-medium">
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Tabelas de Taxas - Uma para cada método selecionado */}
                    {getSelectedPaymentMethods().length > 0 && (
                      <div>
                        <label className="block text-sm text-gray-500 mb-3 font-medium">
                          Resumo Financeiro por Forma de Pagamento
                        </label>

                        <div
                          className={`grid gap-4 ${getSelectedPaymentMethods().length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}
                        >
                          {getSelectedPaymentMethods().map(({ key, data }) => (
                            <div
                              key={key}
                              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                            >
                              {/* Header com nome do método */}
                              <div className="px-4 py-2.5 bg-blue-50 border-b border-gray-200">
                                <h4 className="text-sm font-bold text-blue-600">
                                  {data.name}
                                </h4>
                              </div>

                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">
                                      Item
                                    </th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">
                                      Valor
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  <tr>
                                    <td className="px-4 py-2.5 text-sm text-gray-900">
                                      Valor da Inscrição
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-900 text-right font-semibold">
                                      R${" "}
                                      {data.inscricao
                                        .toFixed(2)
                                        .replace(".", ",")}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-4 py-2.5 text-sm text-gray-500">
                                      Taxa Asaas
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-orange-400 text-right">
                                      - R${" "}
                                      {data.asaasFee
                                        .toFixed(2)
                                        .replace(".", ",")}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-4 py-2.5 text-sm text-gray-500">
                                      Taxa Bubble
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-blue-400 text-right">
                                      R${" "}
                                      {data.bubbleFee
                                        .toFixed(2)
                                        .replace(".", ",")}
                                    </td>
                                  </tr>
                                  <tr className="bg-emerald-50">
                                    <td className="px-4 py-2.5 text-sm text-gray-900 font-bold">
                                      Clube Recebe
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-blue-600 text-right font-bold">
                                      R${" "}
                                      {data.clubReceives
                                        .toFixed(2)
                                        .replace(".", ",")}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-gray-500 mt-3">
                          * As taxas variam por método de pagamento e serão
                          configuradas posteriormente na plataforma
                        </p>
                      </div>
                    )}

                    {/* Cupons de Desconto */}
                    <div className="pt-4 border-t border-gray-200">
                      <label className="flex items-center gap-3 cursor-pointer mb-4">
                        <input
                          type="checkbox"
                          checked={form.wantsCoupon}
                          onChange={(e) =>
                            handleChange("wantsCoupon", e.target.checked)
                          }
                          className="w-5 h-5 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-900 font-medium">
                          Criar cupom de desconto
                        </span>
                      </label>

                      {form.wantsCoupon && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <input
                              type="text"
                              placeholder="Código do cupom (ex: PROMO10)"
                              value={newCouponCode}
                              onChange={(e) =>
                                setNewCouponCode(e.target.value.toUpperCase())
                              }
                              className="sm:col-span-5 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                            <input
                              type="number"
                              placeholder="Valor"
                              value={newCouponDiscount}
                              onChange={(e) =>
                                setNewCouponDiscount(e.target.value)
                              }
                              className="sm:col-span-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                            <select
                              value={newCouponType}
                              onChange={(e) =>
                                setNewCouponType(
                                  e.target.value as "percentage" | "fixed",
                                )
                              }
                              className="sm:col-span-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">R$</option>
                            </select>
                            <button
                              onClick={handleAddCoupon}
                              className="sm:col-span-2 px-4 py-2.5 bg-emerald-50 hover:bg-[#00ff88]/30 border border-emerald-200 text-blue-600 rounded-lg font-semibold text-sm transition-all"
                            >
                              Adicionar
                            </button>
                          </div>

                          {/* Lista de cupons */}
                          {form.coupons.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 font-medium">
                                Cupons criados:
                              </p>
                              {form.coupons.map((coupon) => (
                                <div
                                  key={coupon.id}
                                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-blue-600/20 border border-blue-600/30 text-blue-600 rounded-md text-xs font-bold">
                                      {coupon.code}
                                    </span>
                                    <span className="text-sm text-gray-900">
                                      {coupon.type === "percentage"
                                        ? `${coupon.discount}% de desconto`
                                        : `R$ ${coupon.discount.toFixed(2)} de desconto`}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleRemoveCoupon(coupon.id)
                                    }
                                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-md transition-all"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── STEP 3: ESTRUTURA ─── */}
                {currentStep === "estrutura" && (
                  <div className="space-y-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">
                      Estrutura
                    </h2>

                    {/* Clube Sede */}
                    <div>
                      <label className="block text-sm text-gray-500 mb-2 font-medium">
                        Clube Sede
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do clube sede"
                        value={form.clubSede}
                        onChange={(e) =>
                          handleChange("clubSede", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Clube Sub-sede */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={form.hasSubSede}
                          onChange={(e) =>
                            handleChange("hasSubSede", e.target.checked)
                          }
                          className="w-5 h-5 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-900 font-medium">
                          Clube Sub-sede?
                        </span>
                      </label>

                      {form.hasSubSede && (
                        <input
                          type="text"
                          placeholder="Nome do clube sub-sede"
                          value={form.subSedeName}
                          onChange={(e) =>
                            handleChange("subSedeName", e.target.value)
                          }
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      )}
                    </div>

                    {/* Quadras */}
                    <div>
                      <label className="block text-sm text-gray-500 mb-2 font-medium">
                        Quadras
                      </label>
                      <button
                        onClick={handleAddCourt}
                        className="flex items-center gap-2 text-blue-600 hover:text-[#6d28d9] text-sm font-semibold transition-colors mb-3"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Adicionar Quadra
                      </button>

                      {form.courts.length === 0 ? (
                        <div className="text-gray-500 text-sm italic">
                          Nenhuma quadra adicionada
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {form.courts.map((court, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <input
                                type="text"
                                value={court}
                                onChange={(e) => {
                                  const newCourts = [...form.courts];
                                  newCourts[idx] = e.target.value;
                                  handleChange("courts", newCourts);
                                }}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                              />
                              <button
                                onClick={() => handleRemoveCourt(idx)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all flex-shrink-0"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tempo por Partida */}
                    <div>
                      <label className="block text-sm text-gray-500 mb-2 font-medium">
                        Tempo por Partida (minutos)
                      </label>
                      <div className="relative">
                        <svg
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <input
                          type="number"
                          placeholder="90"
                          value={form.matchDuration}
                          onChange={(e) =>
                            handleChange("matchDuration", e.target.value)
                          }
                          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── STEP 4: CATEGORIAS ─── */}
                {currentStep === "categorias" && (
                  <div className="space-y-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">
                      Categorias
                    </h2>

                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <p className="text-sm text-gray-500">
                          Selecione as categorias que estarão disponíveis no
                          torneio:
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSelectAllCategories}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-600 rounded-lg text-xs font-semibold transition-all"
                          >
                            Selecionar Todas
                          </button>
                          <button
                            onClick={handleDeselectAllCategories}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 rounded-lg text-xs font-semibold transition-all"
                          >
                            Desmarcar Todas
                          </button>
                          <button
                            onClick={() => setShowAddCategory(!showAddCategory)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-[#00ff88]/30 border border-emerald-200 text-blue-600 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Adicionar
                          </button>
                        </div>
                      </div>

                      {/* Campo para adicionar categoria customizada */}
                      {showAddCategory && (
                        <div className="mb-4 p-4 bg-emerald-50 border border-blue-600/20 rounded-lg">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Nome da nova categoria"
                              value={newCategoryName}
                              onChange={(e) =>
                                setNewCategoryName(e.target.value)
                              }
                              onKeyPress={(e) =>
                                e.key === "Enter" && handleAddCustomCategory()
                              }
                              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                              autoFocus
                            />
                            <button
                              onClick={handleAddCustomCategory}
                              className="px-4 py-2 bg-emerald-50 hover:bg-[#00ff88]/30 border border-emerald-200 text-blue-600 rounded-lg text-sm font-semibold transition-all"
                            >
                              Adicionar
                            </button>
                            <button
                              onClick={() => {
                                setShowAddCategory(false);
                                setNewCategoryName("");
                              }}
                              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 rounded-lg text-sm transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {AVAILABLE_CATEGORIES.map((category) => (
                          <label
                            key={category}
                            className={`flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                              form.selectedCategories.includes(category)
                                ? "bg-blue-50 border-blue-600/30"
                                : "bg-white border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={form.selectedCategories.includes(
                                category,
                              )}
                              onChange={() => handleCategoryToggle(category)}
                              className="w-5 h-5 rounded border-gray-300 bg-white text-blue-600 focus:ring-[#7c3aed] focus:ring-offset-0"
                            />
                            <span className="text-sm text-gray-900 font-medium">
                              {category}
                            </span>
                          </label>
                        ))}
                      </div>

                      {form.selectedCategories.length > 0 && (
                        <div className="mt-4 p-4 bg-emerald-50 border border-blue-600/20 rounded-lg">
                          <p className="text-sm text-gray-900 font-medium">
                            {form.selectedCategories.length} categoria
                            {form.selectedCategories.length !== 1
                              ? "s"
                              : ""}{" "}
                            selecionada
                            {form.selectedCategories.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── STEP 5: IMAGENS ─── */}
                {currentStep === "imagens" && (
                  <div className="space-y-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">
                      Imagens
                    </h2>

                    {/* Foto de Perfil do Torneio */}
                    <div>
                      <label className="block text-sm text-gray-500 mb-3 font-medium">
                        Foto de Perfil do Torneio
                      </label>
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                          {form.profileImage ? (
                            <img
                              src={URL.createObjectURL(form.profileImage)}
                              alt="Profile"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <svg
                              className="w-12 h-12 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg font-semibold text-sm cursor-pointer transition-all inline-flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                              />
                            </svg>
                            Escolher Imagem
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleChange("profileImage", file);
                              }}
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-gray-500">
                            PNG ou JPG, máx 2MB. Recomendado 400×400px
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Patrocinadores */}
                    <div>
                      <label className="block text-sm text-gray-500 mb-3 font-medium">
                        Patrocinadores
                      </label>
                      <button
                        onClick={handleAddSponsor}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-600 rounded-lg font-semibold text-sm transition-all mb-4"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Adicionar Patrocinador
                      </button>

                      {form.sponsors.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                          <p className="text-gray-500 text-sm">
                            Nenhum patrocinador adicionado
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {form.sponsors.map((sponsor) => (
                            <div
                              key={sponsor.id}
                              className="bg-white border border-gray-200 rounded-lg p-4"
                            >
                              <div className="flex flex-col sm:flex-row gap-4">
                                {/* Logo do patrocinador */}
                                <div className="w-32 h-32 flex-shrink-0">
                                  <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    {sponsor.image ? (
                                      <img
                                        src={URL.createObjectURL(sponsor.image)}
                                        alt={sponsor.name || "Sponsor"}
                                        className="w-full h-full object-contain p-2"
                                      />
                                    ) : (
                                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                                        <svg
                                          className="w-8 h-8 text-gray-500"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>
                                        <span className="text-xs text-gray-500 mt-2">
                                          Logo
                                        </span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file)
                                              handleSponsorImageChange(
                                                sponsor.id,
                                                file,
                                              );
                                          }}
                                          className="hidden"
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>

                                {/* Nome do patrocinador */}
                                <div className="flex-1 flex flex-col gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1.5">
                                      Nome do Patrocinador
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Ex: Empresa XYZ"
                                      value={sponsor.name}
                                      onChange={(e) =>
                                        handleSponsorNameChange(
                                          sponsor.id,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    />
                                  </div>

                                  <button
                                    onClick={() =>
                                      handleRemoveSponsor(sponsor.id)
                                    }
                                    className="self-start px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    Remover
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === "regras" && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Regras
                    </h3>
                    <p className="text-gray-500">
                      Esta seção será implementada em breve
                    </p>
                  </div>
                )}

                {/* ─── STEP 7: TRANSMISSÃO ─── */}
                {currentStep === "transmissao" && (
                  <div className="space-y-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">
                      Transmissão
                    </h2>

                    {form.courts.length === 0 ? (
                      <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                        <svg
                          className="w-16 h-16 text-gray-500 mx-auto mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Nenhuma quadra cadastrada
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Cadastre as quadras na aba "Estrutura" para configurar
                          os links de transmissão
                        </p>
                        <button
                          onClick={() => setCurrentStep("estrutura")}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg font-semibold text-sm transition-all"
                        >
                          Ir para Estrutura
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500 mb-4">
                          Configure os links de transmissão ao vivo para cada
                          quadra:
                        </p>

                        <div className="space-y-4">
                          {form.courts.map((court, idx) => (
                            <div
                              key={idx}
                              className="bg-white border border-gray-200 rounded-lg p-4"
                            >
                              <label className="block text-sm text-gray-900 font-medium mb-2">
                                {court}
                              </label>
                              <div className="flex gap-2">
                                <div className="flex-1 relative">
                                  <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <input
                                    type="url"
                                    placeholder="https://youtube.com/live/..."
                                    value={form.streamingLinks[court] || ""}
                                    onChange={(e) =>
                                      handleStreamingLinkChange(
                                        court,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                  />
                                </div>
                                {form.streamingLinks[court] && (
                                  <a
                                    href={form.streamingLinks[court]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 rounded-lg transition-all flex items-center gap-2"
                                    title="Testar link"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                          <div className="flex gap-3">
                            <svg
                              className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <p className="text-sm text-blue-400 font-medium mb-1">
                                Dica:
                              </p>
                              <p className="text-xs text-gray-500">
                                Cole o link completo da transmissão do YouTube.
                                Exemplo: https://youtube.com/live/abcd1234
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Botões de navegação */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handlePrevious}
                    disabled={isFirstStep}
                    className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-gray-900 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50"
                  >
                    Anterior
                  </button>

                  {isLastStep ? (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all ${
                        isSubmitting
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow"
                      }`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Criando...
                        </span>
                      ) : (
                        "Criar Torneio"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow transition-all"
                    >
                      Próximo
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Validação */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Campos Obrigatórios
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Por favor, preencha os seguintes campos antes de criar o
                  torneio:
                </p>
                <ul className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="text-red-500 font-bold flex-shrink-0">
                        •
                      </span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTournament;
