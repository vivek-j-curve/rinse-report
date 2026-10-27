import { Shield } from "@/components/ui/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-[460px] bg-[#15171A] text-[#E5E7EB] p-12 flex-col justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-[8px] flex items-center justify-center text-white shrink-0">
            <Shield size={16} />
          </div>
          <span className="font-sans text-lg font-bold tracking-tight text-white">
            Rinse Report
          </span>
        </div>
        <div>
          <h2 className="font-serif text-3xl font-semibold mb-4 text-white">
            AML/CFT compliance,
            <br />
            simplified.
          </h2>
          <p className="text-[#9CA3AF] text-[15px] leading-relaxed max-w-sm">
            Guided suspicious activity reporting with goAML XML generation for
            New Zealand reporting entities.
          </p>
        </div>
        <p className="text-[#6B7280] text-xs">
          &copy; 2026 Rinse Report. All rights reserved.
        </p>
      </div>

      <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto min-h-screen">
        <div className="w-full max-w-[440px] my-auto py-8">{children}</div>
      </div>
    </div>
  );
}
