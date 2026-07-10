"use client";

import { Car, Coins, GraduationCap, Landmark, Plane, ShoppingBag, Target } from "lucide-react";

const iconMap = {
  landmark: Landmark,
  coins: Coins,
  "shopping-bag": ShoppingBag,
  plane: Plane,
  car: Car,
  "graduation-cap": GraduationCap,
  target: Target,
};

export default function GoalIcon({ icon, color = "#d9b86c", size = 18 }) {
  const Icon = iconMap[icon] || Target;
  return <Icon size={size} style={{ color }} />;
}
