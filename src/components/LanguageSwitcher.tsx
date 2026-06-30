import { useState } from 'react';

interface Props {
  currentLocale: 'en' | 'th';
  altPath: string;
}

export default function LanguageSwitcher({ currentLocale, altPath }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" data-lang-switcher>
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 text-sm font-medium text-teak-700 hover:text-bamboo-700 uppercase"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {currentLocale}
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 mt-1 bg-rice-50 border border-teak-500/20 rounded shadow-lg min-w-[6rem]">
          <li>
            <a
              href={currentLocale === 'en' ? altPath : altPath.replace(/^\/th/, '') || '/'}
              className="block px-3 py-2 hover:bg-bamboo-100 no-underline text-teak-900"
            >
              EN
            </a>
          </li>
          <li>
            <a
              href={altPath}
              className="block px-3 py-2 hover:bg-bamboo-100 no-underline text-teak-900"
            >
              TH
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}
