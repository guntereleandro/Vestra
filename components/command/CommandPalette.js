"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, BriefcaseBusiness, ClipboardList, Download, FileUp, Goal, Home, RefreshCw, Settings, Target } from "lucide-react";
import CommandItem from "@/components/command/CommandItem";
import CommandSearch from "@/components/command/CommandSearch";
import useCommandPalette from "@/hooks/useCommandPalette";
import { readGoals } from "@/lib/data/goals";
import { applyAutomaticQuotes } from "@/lib/data/quotes";
import { createBackup, restoreBackup, validateBackup } from "@/lib/data/storage";
import { calculatePositions } from "@/lib/engine/portfolio";
import { fetchAutomaticQuotes } from "@/lib/market/marketService";
import { getAllArticles, getArticleHref, getCategoryLabel } from "@/lib/knowledge/knowledgeService";
import { brandConfig } from "@/lib/config/brandConfig";
import { loadPortfolioData, savePortfolioData } from "@/lib/services/portfolioDataService";
import { registerPortfolioSnapshot } from "@/lib/services/snapshotsService";

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function downloadBackup() {
  const backup = createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${brandConfig.backupFilePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function updateQuotes() {
  const data = await loadPortfolioData();
  const positions = calculatePositions(data.operations, data.quotes, data.assetsMaster);
  const tickers = positions.map((position) => position.ticker);
  if (!tickers.length) return;
  const result = await fetchAutomaticQuotes(tickers);
  const quotes = applyAutomaticQuotes(data.quotes, result.quotes || []);
  await savePortfolioData({ operations: data.operations, assetsMaster: data.assetsMaster, quotes });
  await registerPortfolioSnapshot({ operations: data.operations, assetsMaster: data.assetsMaster, quotes });
  window.location.reload();
}

export default function CommandPalette() {
  const router = useRouter();
  const fileRef = useRef(null);
  const palette = useCommandPalette();
  const [assets, setAssets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [message, setMessage] = useState("");

  function openRoute(href) {
    palette.close();
    router.push(href);
  }

  async function loadData() {
    try {
      const data = await loadPortfolioData();
      setAssets(data.assetsMaster);
      setGoals(readGoals());
      setMessage("");
    } catch {
      setAssets([]);
      setGoals([]);
    }
  }

  useEffect(() => {
    if (palette.open) loadData();
  }, [palette.open]);

  const commands = useMemo(() => {
    const base = [
      { id: "dashboard", title: "Dashboard", subtitle: "Visão geral do patrimônio", group: "Navegar", icon: Home, run: () => openRoute("/") },
      { id: "carteira", title: "Carteira", subtitle: "Posições e cotações", group: "Navegar", icon: BriefcaseBusiness, run: () => openRoute("/carteira") },
      { id: "operacoes", title: "Operações", subtitle: "Histórico de compras, vendas e proventos", group: "Navegar", icon: ClipboardList, run: () => openRoute("/operacoes") },
      { id: "objetivos", title: "Objetivos", subtitle: "Metas patrimoniais", group: "Navegar", icon: Goal, run: () => openRoute("/objetivos") },
      { id: "configuracoes", title: "Configurações", subtitle: "Dados locais, mercado e backup", group: "Navegar", icon: Settings, run: () => openRoute("/configuracoes") },
      { id: "nova-operacao", title: "Nova operação", subtitle: "Abrir cadastro de operação", group: "Ação", icon: ClipboardList, run: () => openRoute("/operacoes?new=operation") },
      { id: "novo-objetivo", title: "Novo objetivo", subtitle: "Criar objetivo patrimonial", group: "Ação", icon: Goal, run: () => openRoute("/objetivos?new=goal") },
      { id: "atualizar-cotacoes", title: "Atualizar cotações", subtitle: "Buscar cotações automáticas disponíveis", group: "Ação", icon: RefreshCw, run: async () => { setMessage("Atualizando cotações..."); await updateQuotes(); } },
      { id: "exportar-backup", title: "Exportar backup", subtitle: "Baixar um arquivo JSON com seus dados", group: "Ação", icon: Download, run: () => { downloadBackup(); setMessage("Backup exportado."); palette.close(); } },
      { id: "importar-backup", title: "Importar backup", subtitle: `Selecionar um arquivo JSON do ${brandConfig.appName}`, group: "Ação", icon: FileUp, run: () => fileRef.current?.click() },
    ];
    const assetCommands = assets.slice(0, 60).map((asset) => ({ id: `asset-${asset.ticker}`, title: asset.ticker, subtitle: asset.name || "Ativo da carteira", group: "Ativo", icon: Target, run: () => openRoute(`/carteira/${asset.ticker}`) }));
    const goalCommands = goals.map((goal) => ({ id: `goal-${goal.id}`, title: goal.title, subtitle: "Objetivo patrimonial", group: "Objetivo", icon: Goal, run: () => openRoute("/objetivos") }));
    const knowledgeCommands = getAllArticles().map((item) => ({ id: `knowledge-${item.id}`, title: item.title, subtitle: `${getCategoryLabel(item.category)} · ${item.tags.join(", ")} · ${item.description} · ${item.content.join(" ")}`, group: "Conhecimento", icon: BookOpen, run: () => openRoute(getArticleHref(item)) }));
    return [...base, ...knowledgeCommands, ...assetCommands, ...goalCommands];
  }, [assets, goals]);

  const filtered = useMemo(() => {
    const term = normalize(palette.query);
    const ranked = commands.filter((command) => !term || normalize(`${command.title} ${command.subtitle} ${command.group}`).includes(term));
    return ranked.slice(0, 12);
  }, [commands, palette.query]);

  function runCommand(command) {
    Promise.resolve(command.run()).catch(() => setMessage("Não foi possível executar esta ação."));
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      palette.setSelectedIndex((index) => Math.min(index + 1, filtered.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      palette.setSelectedIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && filtered[palette.selectedIndex]) {
      event.preventDefault();
      runCommand(filtered[palette.selectedIndex]);
    }
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      validateBackup(parsed);
      restoreBackup(parsed);
      window.location.reload();
    } catch {
      setMessage("Arquivo de backup inválido.");
    }
  }

  if (!palette.open) return null;

  return <div className="fixed inset-0 z-[90] bg-black/70 p-4 backdrop-blur-md" onMouseDown={(event) => event.target === event.currentTarget && palette.close()}>
    <div role="dialog" aria-modal="true" aria-label="Command Palette" className="card mx-auto mt-16 w-full max-w-2xl overflow-hidden rounded-3xl shadow-[0_24px_90px_rgba(0,0,0,.45)]">
      <CommandSearch value={palette.query} onChange={(value) => { palette.setQuery(value); palette.setSelectedIndex(0); }} onKeyDown={onKeyDown} />
      <div className="max-h-[60vh] overflow-y-auto p-2">
        {filtered.length ? filtered.map((command, index) => <CommandItem key={command.id} command={command} active={index === palette.selectedIndex} onSelect={() => runCommand(command)} />) : <div className="px-5 py-12 text-center"><p className="font-display text-xl">Nenhum resultado encontrado</p><p className="mt-2 text-sm text-[#777d78]">Tente buscar por tela, ativo, objetivo ou ação.</p></div>}
      </div>
      <div className="flex items-center justify-between border-t border-white/[.06] px-4 py-3 text-[10px] text-[#626762]"><span>{message || "Use ↑ ↓ para navegar e Enter para abrir."}</span><span>Esc fecha</span></div>
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={importBackup} className="hidden" />
    </div>
  </div>;
}
