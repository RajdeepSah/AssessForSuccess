// Header navigation: mobile menu panel + desktop submenu.
// Without JavaScript the "Menu" control is a plain link to the footer navigation.

const header = document.querySelector<HTMLElement>('[data-header]');

if (header) {
  const toggle = header.querySelector<HTMLAnchorElement>('[data-nav-toggle]');
  const panel = header.querySelector<HTMLElement>('#nav-panel');
  const desktop = window.matchMedia('(min-width: 75em)');

  const setMenu = (open: boolean, restoreFocus = false) => {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    header.toggleAttribute('data-nav-open', open);
    document.documentElement.classList.toggle('nav-locked', open);
    if (!open && restoreFocus) toggle.focus();
  };

  if (toggle && panel) {
    // Upgrade the fallback link into a disclosure button.
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('aria-controls', 'nav-panel');
    toggle.setAttribute('aria-expanded', 'false');

    const flip = (event: Event) => {
      event.preventDefault();
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    };
    toggle.addEventListener('click', flip);
    toggle.addEventListener('keydown', (event) => {
      if (event.key === ' ') flip(event);
    });

    panel.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('a')) setMenu(false);
    });

    desktop.addEventListener('change', () => setMenu(false));
  }

  // ---- submenu (desktop)
  const subToggles = [...header.querySelectorAll<HTMLButtonElement>('[data-sub-toggle]')];

  const closeSubs = (except?: HTMLButtonElement) => {
    for (const btn of subToggles) if (btn !== except) btn.setAttribute('aria-expanded', 'false');
  };

  for (const btn of subToggles) {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      closeSubs(btn);
      btn.setAttribute('aria-expanded', String(open));
    });

    const item = btn.closest<HTMLElement>('[data-sub]');
    item?.addEventListener('focusout', (event) => {
      const next = event.relatedTarget as Node | null;
      if (!next || !item.contains(next)) btn.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target as Node)) closeSubs();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openSub = subToggles.find((btn) => btn.getAttribute('aria-expanded') === 'true');
    if (openSub) {
      openSub.setAttribute('aria-expanded', 'false');
      openSub.focus();
      return;
    }
    if (header.hasAttribute('data-nav-open')) setMenu(false, true);
  });
}
