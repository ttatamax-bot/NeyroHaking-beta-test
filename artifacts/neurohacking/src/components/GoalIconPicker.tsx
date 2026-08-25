import {
  Baby, BookOpen, BriefcaseBusiness, Camera, Code2, Dumbbell, Globe2, GraduationCap,
  HeartPulse, Home, Languages, Leaf, Mountain, Music2, Palette, Plane, Rocket,
  Sparkles, Trophy, Users, WalletCards, Brain, Target, Zap, ShieldCheck, Timer, BadgeCheck,
  Award, Banknote, Coins, Gift, Medal, Gem, PiggyBank, ChartNoAxesCombined,
  Flag, Compass, Route, ListChecks, CircleCheck, Goal,
  type LucideIcon,
} from "lucide-react";

export type GoalIconDefinition = {
  id: string;
  label: string;
  color: string;
  Icon: LucideIcon;
};

export const GOAL_ICONS: GoalIconDefinition[] = [
  { id: "rocket", label: "Старт", color: "#F97316", Icon: Rocket },
  { id: "target", label: "Цель", color: "#F59E0B", Icon: Target },
  { id: "intention", label: "Намерение", color: "#FBBF24", Icon: Goal },
  { id: "flag", label: "Финиш", color: "#FB7185", Icon: Flag },
  { id: "compass", label: "Направление", color: "#60A5FA", Icon: Compass },
  { id: "route", label: "Маршрут", color: "#38BDF8", Icon: Route },
  { id: "milestone", label: "Этап", color: "#4ADE80", Icon: BadgeCheck },
  { id: "checklist", label: "План", color: "#22C55E", Icon: ListChecks },
  { id: "done", label: "Готово", color: "#34D399", Icon: CircleCheck },
  { id: "trophy", label: "Победа", color: "#FFD166", Icon: Trophy },
  { id: "award", label: "Награда", color: "#F59E0B", Icon: Award },
  { id: "medal", label: "Достижение", color: "#FDE047", Icon: Medal },
  { id: "gift", label: "Бонус", color: "#FB7185", Icon: Gift },
  { id: "gem", label: "Ценность", color: "#C084FC", Icon: Gem },
  { id: "focus", label: "Фокус", color: "#A78BFA", Icon: Brain },
  { id: "brain", label: "Развитие", color: "#C084FC", Icon: Sparkles },
  { id: "energy", label: "Энергия", color: "#FB923C", Icon: Zap },
  { id: "resilience", label: "Стойкость", color: "#38BDF8", Icon: ShieldCheck },
  { id: "rhythm", label: "Ритм", color: "#2DD4BF", Icon: Timer },
  { id: "money", label: "Финансы", color: "#FACC15", Icon: WalletCards },
  { id: "banknote", label: "Доход", color: "#4ADE80", Icon: Banknote },
  { id: "coins", label: "Накопления", color: "#FBBF24", Icon: Coins },
  { id: "piggy-bank", label: "Капитал", color: "#34D399", Icon: PiggyBank },
  { id: "chart", label: "Рост", color: "#22C55E", Icon: ChartNoAxesCombined },
  { id: "work", label: "Карьера", color: "#22C55E", Icon: BriefcaseBusiness },
  { id: "book", label: "Знания", color: "#F59E0B", Icon: BookOpen },
  { id: "graduation", label: "Учёба", color: "#60A5FA", Icon: GraduationCap },
  { id: "health", label: "Здоровье", color: "#FB7185", Icon: HeartPulse },
  { id: "fitness", label: "Форма", color: "#F43F5E", Icon: Dumbbell },
  { id: "language", label: "Языки", color: "#34D399", Icon: Languages },
  { id: "home", label: "Дом", color: "#FDBA74", Icon: Home },
  { id: "family", label: "Семья", color: "#F472B6", Icon: Users },
  { id: "nature", label: "Природа", color: "#4ADE80", Icon: Leaf },
  { id: "globe", label: "Путешествия", color: "#2DD4BF", Icon: Globe2 },
  { id: "mountain", label: "Вершина", color: "#A3E635", Icon: Mountain },
  { id: "code", label: "Код", color: "#38BDF8", Icon: Code2 },
  { id: "plane", label: "Полёт", color: "#818CF8", Icon: Plane },
  { id: "camera", label: "Медиа", color: "#FDE047", Icon: Camera },
  { id: "art", label: "Творчество", color: "#FB923C", Icon: Palette },
  { id: "music", label: "Музыка", color: "#A78BFA", Icon: Music2 },
  { id: "baby", label: "Забота", color: "#67E8F9", Icon: Baby },
];

export const DEFAULT_GOAL_ICON = GOAL_ICONS[0];

export function getGoalIcon(iconId?: string): GoalIconDefinition {
  return GOAL_ICONS.find((icon) => icon.id === iconId) ?? DEFAULT_GOAL_ICON;
}

export function GoalIcon({
  iconId,
  size = 24,
  strokeWidth = 1.6,
}: {
  iconId?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const { Icon, color } = getGoalIcon(iconId);
  return <Icon size={size} strokeWidth={strokeWidth} color={color} aria-hidden="true" />;
}