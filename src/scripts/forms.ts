// Progressive enhancement for the site's forms:
// - inline error messages + an error summary (instead of browser bubbles)
// - fields that only show when relevant (data-show-when="field=value1,value2")
// - preselecting options from the URL, e.g. /sports/register/?program=team&sport=basketball

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const isControl = (el: Element): el is Control =>
  el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;

function valueOf(form: HTMLFormElement, name: string): string {
  const item = form.elements.namedItem(name);
  if (item instanceof RadioNodeList) return item.value;
  if (item && isControl(item as Element)) return (item as Control).value;
  return '';
}

function messageFor(control: Control, field: HTMLElement | null): string {
  const v = control.validity;
  if (v.valueMissing) return field?.dataset.requiredMsg ?? 'This field is required';
  if (v.typeMismatch && control.type === 'email') return 'Enter an email address, like name@example.com';
  if (v.patternMismatch) return field?.dataset.patternMsg ?? 'Check the format of this answer';
  if (v.tooLong) return 'This answer is too long';
  return control.validationMessage || 'Check this answer';
}

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-form]')) {
  form.noValidate = true;
  const summary = form.querySelector<HTMLElement>('[data-error-summary]');
  const summaryList = summary?.querySelector('ul');
  const conditionals = [...form.querySelectorAll<HTMLElement>('[data-show-when]')];

  const updateConditionals = () => {
    for (const el of conditionals) {
      const [field, values] = (el.dataset.showWhen ?? '').split('=');
      const show = (values ?? '').split(',').includes(valueOf(form, field));
      el.hidden = !show;
      el.querySelectorAll<Control>('input, select, textarea').forEach((c) => {
        c.disabled = !show;
      });
    }
  };

  // Preselect choices passed in the URL.
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of params) {
    const item = form.elements.namedItem(key);
    if (item instanceof RadioNodeList) {
      for (const node of item) {
        if (node instanceof HTMLInputElement && node.value === value) node.checked = true;
      }
    } else if (item instanceof HTMLSelectElement && [...item.options].some((o) => o.value === value)) {
      item.value = value;
    }
  }

  form.addEventListener('change', updateConditionals);
  updateConditionals();

  const clearError = (field: HTMLElement) => {
    field.classList.remove('has-error');
    const err = field.querySelector<HTMLElement>('.error');
    if (err) {
      err.hidden = true;
      err.textContent = '';
    }
    field.querySelectorAll('[aria-invalid]').forEach((c) => c.removeAttribute('aria-invalid'));
  };

  // Clear a field's error as soon as it becomes valid.
  form.addEventListener('input', (event) => {
    const target = event.target as Element;
    if (!isControl(target)) return;
    const field = target.closest<HTMLElement>('[data-field]');
    if (field?.classList.contains('has-error') && target.checkValidity()) clearError(field);
  });

  form.addEventListener('submit', (event) => {
    const errors: { id: string; message: string }[] = [];
    const seen = new Set<string>();

    form.querySelectorAll<HTMLElement>('[data-field]').forEach(clearError);

    for (const el of form.elements) {
      if (!isControl(el) || el.disabled || el.type === 'hidden' || el.name === 'bot-field') continue;
      if (seen.has(el.name) || el.checkValidity()) continue;
      seen.add(el.name);

      const field = el.closest<HTMLElement>('[data-field]');
      const message = messageFor(el, field);
      field?.classList.add('has-error');
      field?.querySelectorAll<Control>(`[name="${el.name}"]`).forEach((c) => c.setAttribute('aria-invalid', 'true'));
      const err = field?.querySelector<HTMLElement>('.error');
      if (err) {
        err.textContent = message;
        err.hidden = false;
      }
      errors.push({ id: el.id, message });
    }

    if (errors.length && summary && summaryList) {
      event.preventDefault();
      summaryList.replaceChildren(
        ...errors.map(({ id, message }) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `#${id}`;
          a.textContent = message;
          a.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById(id)?.focus();
          });
          li.append(a);
          return li;
        }),
      );
      summary.hidden = false;
      summary.focus();
    } else if (summary) {
      summary.hidden = true;
    }
  });
}
