export default function PreferenceField({ label, description, error, children }) {
  return <label className="block min-w-0"><span className="text-xs font-semibold text-[#c9ccc8]">{label}</span>{description && <span className="mt-1 block text-[11px] leading-4 text-[#6f756f]">{description}</span>}<span className="mt-2 block">{children}</span>{error && <span className="mt-1.5 block text-[11px] text-rose-400" role="alert">{error}</span>}</label>;
}
