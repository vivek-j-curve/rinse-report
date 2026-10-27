"use client";

import { useState, useRef, useEffect } from "react";

export const GOAML_CURRENCIES: { code: string; name: string }[] = [
  { code: "-", name: "Unknown" },
  { code: "AED", name: "UAE Dirham" },
  { code: "AFN", name: "Afghan Afghani" },
  { code: "ALL", name: "Lek" },
  { code: "AMD", name: "Armenian Dram" },
  { code: "ANG", name: "Netherlands Antilles Guilder" },
  { code: "AOA", name: "Angolan Kwanza" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "AWG", name: "Aruban Guilder" },
  { code: "AZN", name: "Azerbaijani Manat" },
  { code: "BAM", name: "Convertible Mark" },
  { code: "BBD", name: "Barbados Dollar" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "BIF", name: "Burundi Franc" },
  { code: "BMD", name: "Bermudian Dollar" },
  { code: "BND", name: "Brunei Dollar" },
  { code: "BOB", name: "Boliviano" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "BSD", name: "Bahamian Dollar" },
  { code: "BTN", name: "Bhutanese Ngultrum" },
  { code: "BWP", name: "Botswana Pula" },
  { code: "BYR", name: "Belarussian Rouble" },
  { code: "BZD", name: "Belize Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CDF", name: "Congolese Franc" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "CNH", name: "Renminbi Off-shore" },
  { code: "CNY", name: "Yuan Renminbi" },
  { code: "COP", name: "Colombian Peso" },
  { code: "CRC", name: "Costa Rican Colón" },
  { code: "CUP", name: "Cuban Peso" },
  { code: "CVE", name: "Cape Verdean Escudo" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "DJF", name: "Djibouti Franc" },
  { code: "DKK", name: "Danish Krone" },
  { code: "DOP", name: "Dominican Peso" },
  { code: "DZD", name: "Algerian Dinar" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "ERN", name: "Eritrean Nakfa" },
  { code: "ETB", name: "Ethiopian Birr" },
  { code: "EUR", name: "Euro" },
  { code: "FJD", name: "Fiji Dollar" },
  { code: "FKP", name: "Falkland Pound" },
  { code: "GBP", name: "Pound Sterling" },
  { code: "GEL", name: "Georgian Lari" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "GIP", name: "Gibraltar Pound" },
  { code: "GMD", name: "Gambian Dalasi" },
  { code: "GNF", name: "Guinean Franc" },
  { code: "GTQ", name: "Guatemalan Quetzal" },
  { code: "GYD", name: "Guyana Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "HNL", name: "Honduran Lempira" },
  { code: "HRK", name: "Croatian Kuna" },
  { code: "HTG", name: "Haitian Gourde" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "INR", name: "Indian Rupee" },
  { code: "IQD", name: "Iraqi Dinar" },
  { code: "IRR", name: "Iranian Rial" },
  { code: "ISK", name: "Icelandic Króna" },
  { code: "JMD", name: "Jamaican Dollar" },
  { code: "JOD", name: "Jordanian Dinar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "KGS", name: "Kyrgyzstani Som" },
  { code: "KHR", name: "Cambodian Riel" },
  { code: "KMF", name: "Comorian Franc" },
  { code: "KPW", name: "North Korean Won" },
  { code: "KRW", name: "South Korean Won" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "KYD", name: "Cayman Islands Dollar" },
  { code: "KZT", name: "Kazakhstani Tenge" },
  { code: "LAK", name: "Lao Kip" },
  { code: "LBP", name: "Lebanese Pound" },
  { code: "LKR", name: "Sri Lankan Rupee" },
  { code: "LRD", name: "Liberian Dollar" },
  { code: "LSL", name: "Lesotho Loti" },
  { code: "LYD", name: "Libyan Dinar" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "MDL", name: "Moldovan Leu" },
  { code: "MGA", name: "Malagasy Ariary" },
  { code: "MKD", name: "Macedonian Dinar" },
  { code: "MMK", name: "Myanmar Kyat" },
  { code: "MNT", name: "Mongolian Tögrög" },
  { code: "MOP", name: "Macanese Pataca" },
  { code: "MRO", name: "Mauritanian Ouguiya" },
  { code: "MUR", name: "Mauritius Rupee" },
  { code: "MVR", name: "Maldivian Rufiyaa" },
  { code: "MWK", name: "Malawian Kwacha" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "MZN", name: "Mozambican Metical" },
  { code: "NAD", name: "Namibian Dollar" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "NIO", name: "Nicaraguan Córdoba" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "NPR", name: "Nepalese Rupee" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "OMR", name: "Omani Rial" },
  { code: "PAB", name: "Panamanian Balboa" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "PGK", name: "Papua New Guinean Kina" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "PLN", name: "Polish Złoty" },
  { code: "PYG", name: "Paraguayan Guaraní" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "RON", name: "Romanian Leu" },
  { code: "RSD", name: "Serbian Dinar" },
  { code: "RUB", name: "Russian Rouble" },
  { code: "RWF", name: "Rwandan Franc" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "SBD", name: "Solomon Islands Dollar" },
  { code: "SCR", name: "Seychellois Rupee" },
  { code: "SDG", name: "Sudanese Pound" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "SHP", name: "St Helena Pound" },
  { code: "SLL", name: "Sierra Leonean Leone" },
  { code: "SOS", name: "Somali Shilling" },
  { code: "SRD", name: "Surinamese Dollar" },
  { code: "SSP", name: "South Sudanese Pound" },
  { code: "STD", name: "São Tomé Dobra" },
  { code: "SYP", name: "Syrian Pound" },
  { code: "SZL", name: "Swazi Lilangeni" },
  { code: "THB", name: "Thai Baht" },
  { code: "TJS", name: "Tajikistani Somoni" },
  { code: "TMT", name: "Turkmenistani Manat" },
  { code: "TND", name: "Tunisian Dinar" },
  { code: "TOP", name: "Tongan Paʻanga" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "TTD", name: "Trinidad and Tobago Dollar" },
  { code: "TWD", name: "Taiwan Dollar" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "UAH", name: "Ukrainian Hryvnia" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "USD", name: "US Dollar" },
  { code: "UYU", name: "Uruguayan Peso" },
  { code: "UZS", name: "Uzbekistani Som" },
  { code: "VAO", name: "Virtual Asset – Other" },
  { code: "VAU", name: "Virtual Asset – Unknown" },
  { code: "VEF", name: "Venezuelan Bolívar" },
  { code: "VND", name: "Vietnamese Đồng" },
  { code: "VUV", name: "Vanuatu Vatu" },
  { code: "WST", name: "Samoan Tala" },
  { code: "XAF", name: "Central African Franc" },
  { code: "XAG", name: "Silver (troy oz)" },
  { code: "XAU", name: "Gold" },
  { code: "XBT", name: "Bitcoin" },
  { code: "XCD", name: "East Caribbean Dollar" },
  { code: "XDR", name: "IMF Special Drawing Rights" },
  { code: "XET", name: "Ethereum" },
  { code: "XLM", name: "Stellar Lumen" },
  { code: "XLN", name: "Litecoin" },
  { code: "XMR", name: "Monero" },
  { code: "XOF", name: "West African Franc" },
  { code: "XPD", name: "Palladium (troy oz)" },
  { code: "XPF", name: "CFP Franc" },
  { code: "XPT", name: "Platinum (troy oz)" },
  { code: "XRP", name: "Ripple" },
  { code: "XTC", name: "Bitcoin Cash" },
  { code: "YER", name: "Yemeni Rial" },
  { code: "ZAR", name: "South African Rand" },
  { code: "ZMW", name: "Zambian Kwacha" },
];

export function CurrencySelect({
  value,
  onChange,
  placeholder = "Select currency...",
  small = false,
}: {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? GOAML_CURRENCIES.filter(
        (c) =>
          c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.name.toLowerCase().includes(query.toLowerCase())
      )
    : GOAML_CURRENCIES;

  const selected = GOAML_CURRENCIES.find((c) => c.code === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
  }

  const sizeClass = small ? "text-[12px] px-2.5 py-1.5" : "text-[13px] px-3 py-2";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between gap-2 bg-surface border border-border rounded-lg ${sizeClass} focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent hover:bg-surface-alt/50 transition-colors text-left`}
      >
        {selected ? (
          <span>
            <span className="font-mono font-semibold">{selected.code}</span>
            <span className="text-text-secondary ml-1.5">{selected.name}</span>
          </span>
        ) : (
          <span className="text-text-tertiary">{placeholder}</span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-text-tertiary shrink-0">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search currencies..."
              className="w-full bg-surface-alt border border-border rounded-md px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className="w-full text-left px-3 py-1.5 text-[12px] text-text-tertiary hover:bg-surface-alt transition-colors"
              >
                Clear selection
              </button>
            )}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-[12px] text-text-tertiary">No results</div>
            )}
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelect(c.code)}
                className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-surface-alt transition-colors flex items-center gap-2 ${
                  c.code === value ? "bg-accent/10 text-accent" : ""
                }`}
              >
                <span className="font-mono font-semibold w-10 shrink-0">{c.code}</span>
                <span className="text-text-secondary truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
