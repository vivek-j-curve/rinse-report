import { Folder } from "@/components/ui/icons";

export default function CasesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Cases
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Manage grouped suspicions and ongoing investigations
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-surface-alt border border-border flex items-center justify-center mb-4">
          <Folder size={24} className="text-text-tertiary" />
        </div>
        <h3 className="text-[15px] font-semibold mb-1">No cases yet</h3>
        <p className="text-text-secondary text-sm max-w-xs">
          Cases are created when multiple suspicions are linked or an
          investigation requires a shared workspace.
        </p>
      </div>
    </div>
  );
}
