import { Layers } from "@/components/ui/icons";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Templates
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Questionnaire templates for different report types
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          {
            type: "STR",
            name: "Suspicious Transaction Report",
            description:
              "Standard report for transactions that appear suspicious under the AML/CFT Act.",
            fields: 42,
          },
          {
            type: "SAR",
            name: "Suspicious Activity Report",
            description:
              "Report for suspicious activity that does not involve a specific transaction.",
            fields: 38,
          },
          {
            type: "LCT",
            name: "Large Cash Transaction",
            description:
              "Mandatory report for cash transactions over $10,000 NZD or equivalent.",
            fields: 28,
          },
          {
            type: "IFT",
            name: "International Funds Transfer",
            description:
              "Report for international wire transfers meeting reporting thresholds.",
            fields: 35,
          },
        ].map((template) => (
          <div
            key={template.type}
            className="bg-surface border border-border rounded-xl p-5 hover:border-border-strong transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center">
                <Layers size={18} className="text-accent" />
              </div>
              <div>
                <span className="inline-flex items-center text-[11px] font-semibold px-1.5 py-px rounded bg-surface-alt border border-border text-text-secondary tracking-wide">
                  {template.type}
                </span>
              </div>
            </div>
            <h3 className="text-[15px] font-semibold mb-1">{template.name}</h3>
            <p className="text-text-secondary text-[13px] leading-relaxed mb-3">
              {template.description}
            </p>
            <span className="text-text-tertiary text-[12px]">
              {template.fields} fields
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
