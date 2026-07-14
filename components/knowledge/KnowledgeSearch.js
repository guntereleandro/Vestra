"use client";
import { Search } from "lucide-react";
export default function KnowledgeSearch({ value, onChange }) { return <label className="relative block"><span className="sr-only">Pesquisar na Central de Conhecimento</span><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#686e69]" size={18} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Pesquisar funcionalidades, conceitos, indicadores ou tutoriais..." className="field py-4 pl-11" /></label>; }
