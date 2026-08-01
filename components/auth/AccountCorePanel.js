"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createRemotePortfolio,
  ensureCurrentRemoteProfile,
  listRemotePortfolios,
  setActiveRemotePortfolio,
  synchronizeActiveRemotePortfolio,
} from "@/lib/services/accountCoreService";
import OperationsMigrationPanel from "@/components/auth/OperationsMigrationPanel";
import DataSourceSelectionPanel from "@/components/auth/DataSourceSelectionPanel";

export default function AccountCorePanel({ user }) {
  const [portfolios, setPortfolios] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setMessage("");
    try {
      await ensureCurrentRemoteProfile(user);
      const remotePortfolios = await listRemotePortfolios();
      setPortfolios(remotePortfolios);
      if (remotePortfolios.length) {
        synchronizeActiveRemotePortfolio().catch(() => null);
      }
      setStatus("ready");
    } catch {
      setStatus("error");
      setMessage("Não foi possível carregar o perfil e as carteiras agora.");
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) return;
    setStatus("saving");
    setMessage("");
    try {
      await createRemotePortfolio({ name: normalizedName });
      synchronizeActiveRemotePortfolio().catch(() => null);
      setName("");
      setPortfolios(await listRemotePortfolios());
      setStatus("ready");
      setMessage("Carteira criada.");
    } catch {
      setStatus("error");
      setMessage("Não foi possível criar a carteira.");
    }
  }

  async function handleActivate(portfolioId) {
    setStatus("saving"); setMessage("");
    try { await setActiveRemotePortfolio(portfolioId); setPortfolios(await listRemotePortfolios()); setStatus("ready"); setMessage("Carteira ativa alterada."); }
    catch { setStatus("error"); setMessage("Não foi possível alterar a carteira ativa."); }
  }

  return <section className="card mt-6 rounded-3xl p-6 sm:p-8">
    <p className="eyebrow">Carteiras da conta</p>
    <h2 className="font-display mt-2 text-2xl text-white">Espaços de organização</h2>
    <p className="mt-2 text-sm leading-relaxed text-[#898e89]">
      Estas carteiras definem acesso e permissões. Seus investimentos continuam no Provider Local.
    </p>

    {status === "loading" && <p className="mt-5 text-sm text-[#898e89]">Carregando...</p>}
    {portfolios.length > 0 && <ul className="mt-5 grid gap-2">
      {portfolios.map((portfolio) => <li
        key={portfolio.id}
        className="flex items-center justify-between rounded-2xl border border-white/[.06] px-4 py-3"
      >
        <span className="text-sm text-white">{portfolio.name}</span>
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-[.14em] text-[#898e89]">{portfolio.role}{portfolio.isActive ? <b className="text-[#d9b86c]">Ativa</b> : <button className="btn-secondary" disabled={status === "saving"} onClick={() => handleActivate(portfolio.id)} type="button">Ativar</button>}</span>
      </li>)}
    </ul>}
    {status !== "loading" && portfolios.length === 0 && <p className="mt-5 text-sm text-[#898e89]">
      Nenhuma carteira remota criada.
    </p>}

    <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleCreate}>
      <label className="sr-only" htmlFor="portfolio-name">Nome da carteira</label>
      <input
        id="portfolio-name"
        className="input flex-1"
        maxLength={120}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nome da primeira carteira"
        value={name}
      />
      <button className="btn-primary" disabled={status === "saving"} type="submit">
        {status === "saving" ? "Criando..." : "Criar carteira"}
      </button>
    </form>
    {message && <p className="mt-3 text-sm text-[#b7bbb7]" role="status">{message}</p>}
    {portfolios.length > 0 && <><DataSourceSelectionPanel /><OperationsMigrationPanel /></>}
  </section>;
}
