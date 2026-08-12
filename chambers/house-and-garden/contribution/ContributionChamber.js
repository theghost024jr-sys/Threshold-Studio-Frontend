import { resolveVaultPath } from '../vault/paths.js';

const CLASS = 'hag-contrib';
const FIELDS = [
  { id: 'name', label: 'Plant Name', type: 'text', required: true, maxLength: 80 },
  { id: 'family', label: 'Plant Family', type: 'text', required: false, maxLength: 80 },
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: ['perennial', 'annual', 'biennial', 'shrub', 'tree', 'vine', 'groundcover', 'other'],
  },
  {
    id: 'season',
    label: 'Season',
    type: 'select',
    required: false,
    options: ['spring', 'summer', 'autumn', 'winter', 'year-round'],
  },
  { id: 'tags', label: 'Tags', type: 'text', required: false, placeholder: 'comma-separated', maxLength: 200 },
  { id: 'note', label: 'Seasonal Note', type: 'textarea', required: false, maxLength: 500 },
  { id: 'contributor', label: 'Your Name / Handle', type: 'text', required: false, maxLength: 60 },
];

export class ContributionChamber {
  constructor(root, store, eventBus, config) {
    this.root = root;
    this.store = store;
    this.eventBus = eventBus;
    this.config = config;
    this._wrapper = null;
    this._open = false;
    this._submitting = false;
    this._closeTimer = null;
    this._boundKeydown = this._handleKeydown.bind(this);
  }

  mount() {
    if (!this.config.contributionOpen) return;
    this._wrapper = document.createElement('div');
    this._wrapper.className = CLASS;
    this._buildTrigger();
    this._buildPanel();
    this.root.appendChild(this._wrapper);
    document.addEventListener('keydown', this._boundKeydown);
  }

  open() {
    if (this._open) return;
    this._open = true;
    this._panel.classList.add(`${CLASS}__panel--open`);
    this._panel.setAttribute('aria-hidden', 'false');
    this._trigger.setAttribute('aria-expanded', 'true');
    this._form.querySelector('input, select, textarea, button')?.focus();
    this.eventBus.emit('contribution:open', {});
  }

  close() {
    if (!this._open) return;
    this._open = false;
    this._panel.classList.remove(`${CLASS}__panel--open`);
    this._panel.setAttribute('aria-hidden', 'true');
    this._trigger.setAttribute('aria-expanded', 'false');
    this._resetForm();
    this.eventBus.emit('contribution:close', {});
  }

  destroy() {
    clearTimeout(this._closeTimer);
    document.removeEventListener('keydown', this._boundKeydown);
    this._wrapper?.remove();
  }

  _buildTrigger() {
    this._trigger = document.createElement('button');
    this._trigger.className = `${CLASS}__trigger`;
    this._trigger.textContent = 'Add to the Garden';
    this._trigger.setAttribute('aria-expanded', 'false');
    this._trigger.setAttribute('aria-controls', 'hag-contrib-panel');
    this._trigger.addEventListener('click', () => (this._open ? this.close() : this.open()));
    this._wrapper.appendChild(this._trigger);
  }

  _buildPanel() {
    this._panel = document.createElement('aside');
    this._panel.className = `${CLASS}__panel`;
    this._panel.id = 'hag-contrib-panel';
    this._panel.setAttribute('role', 'dialog');
    this._panel.setAttribute('aria-modal', 'true');
    this._panel.setAttribute('aria-label', 'Add to the Garden');
    this._panel.setAttribute('aria-hidden', 'true');

    const header = document.createElement('div');
    header.className = `${CLASS}__header`;
    const title = document.createElement('h2');
    title.className = `${CLASS}__title`;
    title.textContent = 'Add to the Root Archive';
    const closeButton = document.createElement('button');
    closeButton.className = `${CLASS}__close`;
    closeButton.setAttribute('aria-label', 'Close contribution panel');
    closeButton.innerHTML = `<img src="${resolveVaultPath('hag:contrib:icon-cancel')}" alt="" />`;
    closeButton.addEventListener('click', () => this.close());
    header.append(title, closeButton);

    const background = document.createElement('div');
    background.className = `${CLASS}__bg`;
    background.style.backgroundImage = `url(${resolveVaultPath('hag:contrib:form-bg')})`;
    this._form = this._buildForm();
    this._panel.append(background, header, this._form);
    this._wrapper.appendChild(this._panel);
  }

  _buildForm() {
    const form = document.createElement('form');
    form.className = `${CLASS}__form`;
    form.noValidate = true;

    FIELDS.forEach((field) => {
      const group = document.createElement('div');
      group.className = `${CLASS}__field`;
      const label = document.createElement('label');
      label.htmlFor = `hag-contrib-${field.id}`;
      label.className = `${CLASS}__label`;
      label.textContent = field.required ? `${field.label} *` : field.label;

      let input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 4;
      } else if (field.type === 'select') {
        input = document.createElement('select');
        input.appendChild(new Option('- choose -', ''));
        field.options.forEach((option) => input.appendChild(new Option(option, option)));
      } else {
        input = document.createElement('input');
        input.type = 'text';
      }
      input.id = `hag-contrib-${field.id}`;
      input.name = field.id;
      input.className = `${CLASS}__input`;
      input.required = field.required;
      if (field.maxLength) input.maxLength = field.maxLength;
      if (field.placeholder) input.placeholder = field.placeholder;

      const error = document.createElement('span');
      error.className = `${CLASS}__error`;
      error.id = `${input.id}-err`;
      error.setAttribute('aria-live', 'polite');
      input.setAttribute('aria-describedby', error.id);
      group.append(label, input, error);
      form.appendChild(group);
    });

    const actions = document.createElement('div');
    actions.className = `${CLASS}__actions`;
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = `${CLASS}__cancel`;
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => this.close());
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = `${CLASS}__submit`;
    submitButton.textContent = 'Submit';
    actions.append(cancelButton, submitButton);
    form.appendChild(actions);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this._handleSubmit(form);
    });
    return form;
  }

  _handleSubmit(form) {
    if (this._submitting || !this._validate(form)) return;
    this._submitting = true;
    const entry = this._collectValues(form);
    this.eventBus.emit('contribution:submit', { entry });
    try {
      this.eventBus.emit('rootArchive:addEntry', { entry });
      this.store.set('hag:contribution:latest', entry);
      this.eventBus.emit('contribution:success', { entry });
      this._showSuccess();
    } catch (error) {
      this.eventBus.emit('contribution:error', { reason: error.message });
      this._showError(error.message);
    } finally {
      this._submitting = false;
    }
  }

  _validate(form) {
    let valid = true;
    FIELDS.forEach((field) => {
      const input = form.elements[field.id];
      const error = this._panel.querySelector(`#hag-contrib-${field.id}-err`);
      error.textContent = '';
      input.removeAttribute('aria-invalid');
      if (field.required && !input.value.trim()) {
        error.textContent = `${field.label} is required.`;
        input.setAttribute('aria-invalid', 'true');
        valid = false;
      }
    });
    if (!valid) form.querySelector('[aria-invalid="true"]')?.focus();
    return valid;
  }

  _collectValues(form) {
    const raw = {};
    FIELDS.forEach(({ id }) => {
      raw[id] = form.elements[id].value.trim();
    });
    raw.tags = raw.tags ? raw.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
    raw.createdAt = new Date().toISOString();
    return raw;
  }

  _showSuccess() {
    this._panel.querySelector(`.${CLASS}__success`)?.remove();
    const message = document.createElement('div');
    message.className = `${CLASS}__success`;
    message.setAttribute('role', 'status');
    message.textContent = 'Your contribution has been added to the Root Archive.';
    this._panel.appendChild(message);
    clearTimeout(this._closeTimer);
    this._closeTimer = setTimeout(() => this.close(), 3000);
  }

  _showError(reason) {
    this._panel.querySelector(`.${CLASS}__err-banner`)?.remove();
    const message = document.createElement('div');
    message.className = `${CLASS}__err-banner`;
    message.setAttribute('role', 'alert');
    message.textContent = `Submission failed: ${reason}`;
    this._panel.insertBefore(message, this._form);
  }

  _resetForm() {
    this._form?.reset();
    this._panel.querySelectorAll(`.${CLASS}__error`).forEach((element) => {
      element.textContent = '';
    });
    this._panel.querySelectorAll('[aria-invalid]').forEach((element) => {
      element.removeAttribute('aria-invalid');
    });
    this._panel.querySelector(`.${CLASS}__success`)?.remove();
    this._panel.querySelector(`.${CLASS}__err-banner`)?.remove();
  }

  _handleKeydown(event) {
    if (event.key === 'Escape' && this._open) this.close();
  }
}