/**
 * TRAJDER - wspolny panel zakupu.
 *
 * HTML ma zawierac tylko window.purchasePanelConfig z danymi produktu.
 * Caly mechanizm wyboru ilosci, kraju, dodatku, ceny i linku Easytools
 * jest obslugiwany tutaj.
 *
 * Kod celowo uzywa prostej skladni TypeScript/ES5, zeby pasowal do
 * starszego toolchainu projektu.
 */

(function (): void {
  'use strict';

  var win: any = window;

  if (win.__trajderPurchasePanelLoaded) {
    return;
  }
  win.__trajderPurchasePanelLoaded = true;

  var updatePanelFn: any = function (): void {};
  var validatePanelFn: any = function (): boolean { return false; };

  // Zostawiamy zgodnosc z obecnym HTML: onchange="updateTableLink()"
  // oraz onclick="return handleTableDisabledClick()".
  win.updateTableLink = function (): void {
    updatePanelFn();
  };

  win.handleTableDisabledClick = function (): boolean {
    return validatePanelFn();
  };

  function initPurchasePanel(): void {
    var config: any = win.purchasePanelConfig;

    if (!config || !config.variants || !config.delivery) {
      return;
    }

    var lang: string = String(config.language || document.documentElement.lang || 'pl')
      .toLowerCase()
      .split('-')[0];

    var messages: any = {
      pl: {
        quantity: 'Wybierz ilość',
        country: 'Wybierz kraj dostawy',
        missingLink: 'Ten wariant nie ma jeszcze podpiętego linku Easytools.',
        noResults: 'Brak wyników',
        free: 'gratis'
      },
      en: {
        quantity: 'Select quantity',
        country: 'Select delivery country',
        missingLink: 'This option does not have a checkout link yet.',
        noResults: 'No results',
        free: 'free'
      },
      de: {
        quantity: 'Menge auswählen',
        country: 'Lieferland auswählen',
        missingLink: 'Für diese Variante ist noch kein Checkout-Link hinterlegt.',
        noResults: 'Keine Ergebnisse',
        free: 'kostenlos'
      }
    };

    var text: any = messages[lang] || messages.en;

    function el(id: string): any {
      return document.getElementById(id);
    }

    // Nogi maja shipping-country-config, a wykrawarka table-config.
    var quantitySelect: any = el('quantity-config');
    var countrySelect: any = el('shipping-country-config') || el('country-config') || el('table-config');
    var buyButton: any = el('buy-table-btn');
    var addonCheckbox: any = el('addon-checkbox');

    if (!countrySelect || !buyButton) {
      return;
    }

    function own(obj: any, key: string): boolean {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }

    function validNumber(value: any): boolean {
      return typeof value === 'number' && isFinite(value) && value >= 0;
    }

    function currencySymbol(): string {
      if (config.currencySymbol) {
        return String(config.currencySymbol);
      }
      if (config.currency === 'EUR') {
        return '€';
      }
      if (config.currency === 'PLN' || !config.currency) {
        return 'zł';
      }
      return String(config.currency);
    }

    function formatPrice(value: number): string {
      var fixed: string = Number(value).toFixed(2);
      var parts: string[] = fixed.split('.');
      var integerPart: string = parts[0];
      var decimalPart: string = parts[1] || '00';
      var thousandSeparator: string = lang === 'pl' ? ' ' : (lang === 'de' ? '.' : ',');
      var decimalSeparator: string = (lang === 'pl' || lang === 'de') ? ',' : '.';
      var symbol: string = currencySymbol();

      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

      if (config.currency === 'EUR' && lang === 'en') {
        return symbol + integerPart + decimalSeparator + decimalPart;
      }

      return integerPart + decimalSeparator + decimalPart + ' ' + symbol;
    }

    function clearElement(node: any): void {
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
    }

    function createPlaceholder(select: any, label: string): void {
      var option: any = document.createElement('option');
      option.value = 'none';
      option.textContent = label;
      option.disabled = true;
      option.selected = true;
      select.appendChild(option);
    }

    function populateQuantitySelect(): void {
      if (!quantitySelect) {
        return;
      }

      clearElement(quantitySelect);
      createPlaceholder(quantitySelect, text.quantity);

      var key: string;
      for (key in config.variants) {
        if (!own(config.variants, key)) {
          continue;
        }

        var variant: any = config.variants[key];
        var option: any = document.createElement('option');
        option.value = key;
        option.textContent = variant.label || key;
        quantitySelect.appendChild(option);
      }

      // Ilosci nie wybieramy automatycznie, chyba ze jawnie ustawisz defaultVariant.
      if (config.defaultVariant && config.variants[config.defaultVariant]) {
        quantitySelect.value = config.defaultVariant;
      } else {
        quantitySelect.selectedIndex = 0;
      }
    }

    function populateCountrySelect(): void {
      clearElement(countrySelect);
      createPlaceholder(countrySelect, text.country);

      var key: string;
      for (key in config.delivery) {
        if (!own(config.delivery, key)) {
          continue;
        }

        var delivery: any = config.delivery[key];
        var option: any = document.createElement('option');
        option.value = key;
        option.textContent = delivery.label || key;
        countrySelect.appendChild(option);
      }

      // Bardzo wazne: nie wybieramy po prostu pierwszego kraju.
      // PL moze ustawic defaultCountry: 'pl'. EN/DE daja null i pozostaje brak wyboru.
      if (config.defaultCountry && config.delivery[config.defaultCountry]) {
        countrySelect.value = config.defaultCountry;
      } else {
        countrySelect.selectedIndex = 0;
      }
    }

    function selectedKey(select: any): string {
      if (!select || select.selectedIndex < 0) {
        return '';
      }

      var value: string = String(select.value || '');
      if (!value || value === 'none') {
        return '';
      }

      return value;
    }

    function currentVariantKey(): string {
      if (quantitySelect) {
        return selectedKey(quantitySelect);
      }

      // Produkt bez wyboru ilosci, np. wykrawarka.
      if (config.defaultVariant && config.variants[config.defaultVariant]) {
        return String(config.defaultVariant);
      }

      var key: string;
      for (key in config.variants) {
        if (own(config.variants, key)) {
          return key;
        }
      }

      return '';
    }

    function setText(id: string, value: string): void {
      var node: any = el(id);
      if (node) {
        node.textContent = value;
      }
    }

    function setError(type: string, message: string): void {
      var isQuantity: boolean = type === 'quantity';
      var label: any = el(isQuantity ? 'quantity-label' : 'shipping-label');

      // Wykrawarka uzywa config-label zamiast shipping-label.
      if (!isQuantity && !label) {
        label = el('config-label');
      }

      var wrapper: any = el(isQuantity ? 'custom-quantity-select' : 'custom-shipping-country-select');
      if (!isQuantity && !wrapper) {
        wrapper = el('custom-country-select');
      }

      var input: any = el(isQuantity ? 'custom-quantity-input' : 'custom-shipping-country-input');
      if (!isQuantity && !input) {
        input = el('custom-country-input');
      }

      if (label) {
        label.style.color = message ? 'red' : '#707070';
        label.style.fontWeight = message ? 'bold' : '400';
        label.textContent = message || (isQuantity ? text.quantity : text.country);
      }

      if (wrapper) {
        if (message) {
          wrapper.classList.add('is-error');
        } else {
          wrapper.classList.remove('is-error');
        }
      }

      if (message && input) {
        try {
          input.focus();
        } catch (ignore) {}
      }
    }

    function getCheckoutUrl(delivery: any, variantKey: string, withAddon: boolean): string {
      if (!delivery || !delivery.links || !delivery.links[variantKey]) {
        return '';
      }

      var links: any = delivery.links[variantKey];
      var raw: any = withAddon ? links.addon : links.solo;

      if (typeof raw !== 'string') {
        return '';
      }

      raw = raw.replace(/^\s+|\s+$/g, '');
      return raw;
    }

    function updatePanel(): void {
      var variantKey: string = currentVariantKey();
      var countryKey: string = selectedKey(countrySelect);
      var variant: any = variantKey ? config.variants[variantKey] : null;
      var delivery: any = countryKey ? config.delivery[countryKey] : null;
      var withAddon: boolean = !!(addonCheckbox && addonCheckbox.checked);

      var productPrice: any = variant ? variant.price : null;
      var addonPrice: any = variant ? variant.addon : null;
      var shippingPrice: any = delivery ? delivery.shipping : null;

      setText('summary-product-price', validNumber(productPrice) ? formatPrice(productPrice) : '—');
      setText('summary-addon-price', validNumber(addonPrice) ? formatPrice(addonPrice) : '—');
      setText('summary-shipping-price', validNumber(shippingPrice) ? formatPrice(shippingPrice) : '—');

      var addonRow: any = el('summary-addon-row');
      if (addonRow) {
        addonRow.style.display = withAddon ? 'flex' : 'none';
      }

      var shippingFreeLabel: any = el('summary-shipping-label');
      if (shippingFreeLabel) {
        shippingFreeLabel.style.display = validNumber(shippingPrice) && shippingPrice === 0 ? 'inline' : 'none';
      }

      var complete: boolean = !!(
        variant &&
        delivery &&
        validNumber(productPrice) &&
        validNumber(shippingPrice) &&
        (!withAddon || validNumber(addonPrice))
      );

      if (complete) {
        var total: number = productPrice + shippingPrice + (withAddon ? addonPrice : 0);
        setText('summary-total-price', formatPrice(Math.round(total * 100) / 100));
      } else {
        setText('summary-total-price', '—');
      }

      var finalUrl: string = complete ? getCheckoutUrl(delivery, variantKey, withAddon) : '';

      if (finalUrl) {
        buyButton.setAttribute('href', finalUrl);
        buyButton.setAttribute('aria-disabled', 'false');
      } else {
        buyButton.removeAttribute('href');
        buyButton.setAttribute('aria-disabled', 'true');
      }

      // Po normalnej zmianie zdejmujemy czerwone obramowania.
      if (variant) {
        setError('quantity', '');
      }
      if (delivery) {
        setError('shipping', '');
      }
    }

    function validatePanel(): boolean {
      var variantKey: string = currentVariantKey();
      var countryKey: string = selectedKey(countrySelect);
      var variant: any = variantKey ? config.variants[variantKey] : null;
      var delivery: any = countryKey ? config.delivery[countryKey] : null;
      var withAddon: boolean = !!(addonCheckbox && addonCheckbox.checked);

      if (!variant) {
        setError('quantity', text.quantity + ':');
        return false;
      }

      if (!delivery) {
        setError('shipping', text.country + ':');
        return false;
      }

      if (!getCheckoutUrl(delivery, variantKey, withAddon)) {
        setError('shipping', text.missingLink);
        return false;
      }

      return true;
    }

    updatePanelFn = updatePanel;
    validatePanelFn = validatePanel;

    function initCustomSelect(nativeSelect: any, wrapperId: string, inputId: string, dropdownId: string, emptyText: string): void {
      var wrapper: any = el(wrapperId);
      var input: any = el(inputId);
      var dropdown: any = el(dropdownId);
      var control: any = wrapper
        ? wrapper.querySelector('.custom-country-select__control')
        : null;

      if (!nativeSelect || !wrapper || !input || !dropdown) {
        return;
      }

      var options: any[] = [];
      var filtered: any[] = [];
      var activeIndex: number = -1;

      function rebuildOptions(): void {
        options = [];

        var i: number;
        for (i = 0; i < nativeSelect.options.length; i++) {
          var option: any = nativeSelect.options[i];
          if (!option.disabled && option.value && option.value !== 'none') {
            options.push({
              nativeIndex: i,
              value: option.value,
              text: String(option.textContent || option.innerText || option.value)
            });
          }
        }
      }

      function currentOption(): any {
        var selectedIndex: number = nativeSelect.selectedIndex;
        var i: number;

        for (i = 0; i < options.length; i++) {
          if (options[i].nativeIndex === selectedIndex) {
            return options[i];
          }
        }

        return null;
      }

      function syncInput(): void {
        var current: any = currentOption();
        input.value = current ? current.text : '';
      }

      function closeDropdown(): void {
        wrapper.classList.remove('is-open');
        activeIndex = -1;
        syncInput();
      }

      function setSelected(item: any): void {
        nativeSelect.selectedIndex = item.nativeIndex;
        input.value = item.text;
        wrapper.classList.remove('is-open');
        wrapper.classList.remove('is-error');
        activeIndex = -1;

        // Dziala rowniez wtedy, gdy w HTML nadal jest onchange="updateTableLink()".
        updatePanel();
      }

      function renderDropdown(searchText: string): void {
        var query: string = String(searchText || '').toLowerCase().replace(/^\s+|\s+$/g, '');
        filtered = [];
        activeIndex = -1;
        clearElement(dropdown);

        var i: number;
        for (i = 0; i < options.length; i++) {
          if (options[i].text.toLowerCase().indexOf(query) !== -1) {
            filtered.push(options[i]);
          }
        }

        if (!filtered.length) {
          var empty: any = document.createElement('div');
          empty.className = 'custom-country-select__empty';
          empty.textContent = emptyText;
          dropdown.appendChild(empty);
          return;
        }

        var selected: any = currentOption();

        for (i = 0; i < filtered.length; i++) {
          (function (item: any, index: number): void {
            var row: any = document.createElement('div');
            row.className = 'custom-country-select__option';
            row.textContent = item.text;

            if (selected && selected.nativeIndex === item.nativeIndex) {
              row.classList.add('is-selected');
            }

            row.addEventListener('mousedown', function (event: any): void {
              event.preventDefault();
              setSelected(item);
            });

            dropdown.appendChild(row);
          })(filtered[i], i);
        }
      }

      function highlightActive(): void {
        var children: any = dropdown.children;
        var i: number;

        for (i = 0; i < children.length; i++) {
          if (i === activeIndex) {
            children[i].classList.add('is-highlighted');
          } else {
            children[i].classList.remove('is-highlighted');
          }
        }
      }

      function openDropdown(): void {
        wrapper.classList.add('is-open');
        wrapper.classList.remove('is-error');
        renderDropdown('');
      }

      rebuildOptions();
      syncInput();
      renderDropdown('');

      input.addEventListener('focus', function (): void {
        // Pole wyszukiwane, np. kraj - otwieramy po focusie.
        // Pole readonly, np. ilosc - obsluguje je klik ponizej.
        if (!input.readOnly) {
          openDropdown();

          try {
            input.select();
          } catch (ignore) {}
        }
      });

      input.addEventListener('click', function (): void {
        // Ilosc: klasyczny dropdown bez wpisywania.
        if (input.readOnly) {
          if (wrapper.classList.contains('is-open')) {
            closeDropdown();
          } else {
            openDropdown();
          }
          return;
        }

        // Kraj: nadal mozna wpisywac i filtrowac.
        if (!wrapper.classList.contains('is-open')) {
          openDropdown();
        }
      });

      // Klik w strzalke lub pozostala czesc pola dziala dla obu dropdownow.
      // Dzieki temu wybrany juz kraj mozna ponownie rozwinac strzalka.
      if (control) {
        control.addEventListener('mousedown', function (event: any): void {
          // Klik bezposrednio w input obsluguje listener powyzej.
          if (event.target === input) {
            return;
          }

          event.preventDefault();

          if (wrapper.classList.contains('is-open')) {
            closeDropdown();
            input.blur();
          } else {
            openDropdown();
            input.focus();
          }
        });
      }

      input.addEventListener('input', function (): void {
        wrapper.classList.add('is-open');
        wrapper.classList.remove('is-error');
        renderDropdown(input.value);
      });

      input.addEventListener('keydown', function (event: any): void {
        if (event.key === 'Escape' || event.keyCode === 27) {
          event.preventDefault();
          closeDropdown();
          input.blur();
          return;
        }

        if (event.key === 'ArrowDown' || event.keyCode === 40) {
          event.preventDefault();
          if (!wrapper.classList.contains('is-open')) {
            openDropdown();
          }
          if (filtered.length) {
            activeIndex = activeIndex < filtered.length - 1 ? activeIndex + 1 : 0;
            highlightActive();
          }
          return;
        }

        if (event.key === 'ArrowUp' || event.keyCode === 38) {
          event.preventDefault();
          if (!wrapper.classList.contains('is-open')) {
            openDropdown();
          }
          if (filtered.length) {
            activeIndex = activeIndex > 0 ? activeIndex - 1 : filtered.length - 1;
            highlightActive();
          }
          return;
        }

        if ((event.key === 'Enter' || event.keyCode === 13) && wrapper.classList.contains('is-open')) {
          event.preventDefault();
          if (activeIndex >= 0 && filtered[activeIndex]) {
            setSelected(filtered[activeIndex]);
          } else if (filtered.length === 1) {
            setSelected(filtered[0]);
          }
        }
      });

      nativeSelect.addEventListener('change', function (): void {
        rebuildOptions();
        syncInput();
        updatePanel();
      });

      document.addEventListener('mousedown', function (event: any): void {
        if (!wrapper.contains(event.target)) {
          closeDropdown();
        }
      });
    }

    // Najpierw dane -> selecty, dopiero potem custom dropdowny.
    populateQuantitySelect();
    populateCountrySelect();

    if (quantitySelect) {
      initCustomSelect(
        quantitySelect,
        'custom-quantity-select',
        'custom-quantity-input',
        'custom-quantity-dropdown',
        text.noResults
      );
    }

    // Nogi maja nazwy custom-shipping-country-*, wykrawarka custom-country-*.
    if (el('custom-shipping-country-select')) {
      initCustomSelect(
        countrySelect,
        'custom-shipping-country-select',
        'custom-shipping-country-input',
        'custom-shipping-country-dropdown',
        text.noResults
      );
    } else {
      initCustomSelect(
        countrySelect,
        'custom-country-select',
        'custom-country-input',
        'custom-country-dropdown',
        text.noResults
      );
    }

    if (addonCheckbox) {
      addonCheckbox.addEventListener('change', updatePanel);
    }

    buyButton.addEventListener('click', function (event: any): void {
      if (!validatePanel()) {
        event.preventDefault();
      }
    });

    updatePanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPurchasePanel);
  } else {
    initPurchasePanel();
  }
})();
