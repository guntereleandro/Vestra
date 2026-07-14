import Link from "next/link";
import KnowledgeArticle from "@/components/knowledge/KnowledgeArticle";
import { getCategoryLabel } from "@/lib/knowledge/knowledgeService";
export default function KnowledgeCategory({ category, articles, title, description }) { return <div className="page-container"><header><p className="eyebrow">Central de Conhecimento</p><h1 className="font-display mt-2 text-3xl sm:text-4xl">{title || getCategoryLabel(category)}</h1><p className="mt-3 max-w-2xl text-sm text-[#777d78]">{description}</p><Link href="/conhecimento" className="mt-4 inline-block text-xs font-semibold text-[#d9b86c]">← Voltar à central</Link></header><div className="mt-8 space-y-4">{articles.map((item) => <KnowledgeArticle key={item.id} article={item} />)}</div></div>; }
