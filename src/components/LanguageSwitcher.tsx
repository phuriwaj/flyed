import { useState } from 'react';

interface Props {
  currentLocale: 'en' | 'th';
  altPath: string;
  currentPathname: string;
}

export default function LanguageSwitcher({ currentLocale, altPath, currentPathname }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" data-lang-switcher>
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 text-button-utility text-canvas/90 hover:text-canvas uppercase transition-colors duration-150"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Switch language"
      >
        {currentLocale}
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 mt-1 bg-canvas border border-hairline rounded-md min-w-[6rem]">
          <li>
            <a
              href={currentLocale === 'en' ? currentPathname : altPath}
              className="block px-3 py-2 text-body text-ink hover:bg-canvas-parchment no-underline"
            >
              EN
            </a>
          </li>
          <li>
            <a
              href={currentLocale === 'en' ? altPath : currentPathname}
              className="block px-3 py-2 text-body text-ink hover:bg-canvas-parchment no-underline"
            >
              TH
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}