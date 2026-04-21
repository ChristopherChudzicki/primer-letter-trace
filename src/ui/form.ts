import type { SheetConfig } from "../config/types";
import type { Store } from "../state/store";
import { parseContent } from "../config/content";
import { PRESETS, presetByKey } from "../config/presets";

export function bindForm(root: HTMLElement, store: Store<SheetConfig>): void {
  root.innerHTML = buildFormHtml();

  const starterField = root.querySelector<HTMLSelectElement>("#starter")!;
  const contentField = root.querySelector<HTMLTextAreaElement>("#content")!;
  const layoutGroup = root.querySelectorAll<HTMLInputElement>("input[name='layout']");
  const demoGroup = root.querySelectorAll<HTMLInputElement>("input[name='demo']");
  const traceGroup = root.querySelectorAll<HTMLInputElement>("input[name='trace']");
  const sizeGroup = root.querySelectorAll<HTMLInputElement>("input[name='size']");
  const themeGroup = root.querySelectorAll<HTMLInputElement>("input[name='theme']");
  const paperGroup = root.querySelectorAll<HTMLInputElement>("input[name='paper']");
  const printButton = root.querySelector<HTMLButtonElement>("#print-btn")!;

  store.run((config) => {
    // Textbox is the single source of truth for content layout: one line per
    // item (newline = new row). Don't collapse to spaces on display — that
    // would misrepresent what the sheet actually renders.
    const desired = config.content.join("\n");
    if (parseContent(contentField.value).join("\n") !== desired) {
      contentField.value = desired;
    }
    setRadio(layoutGroup, config.layout);
    setRadio(demoGroup, config.showDemo ? "yes" : "no");
    setRadio(traceGroup, String(config.traceCount));
    setRadio(sizeGroup, config.size);
    setRadio(themeGroup, config.theme);
    setRadio(paperGroup, config.paperSize);
  });

  starterField.addEventListener("change", () => {
    const preset = presetByKey(starterField.value);
    if (!preset) return;
    store.set(preset.config);
  });

  contentField.addEventListener("input", () => {
    store.update({ content: parseContent(contentField.value) });
  });

  bindRadioGroup(layoutGroup, (v) => store.update({ layout: v as SheetConfig["layout"] }));
  bindRadioGroup(demoGroup, (v) => store.update({ showDemo: v === "yes" }));
  bindRadioGroup(traceGroup, (v) => store.update({ traceCount: Number(v) as SheetConfig["traceCount"] }));
  bindRadioGroup(sizeGroup, (v) => store.update({ size: v as SheetConfig["size"] }));
  bindRadioGroup(themeGroup, (v) => store.update({ theme: v as SheetConfig["theme"] }));
  bindRadioGroup(paperGroup, (v) => store.update({ paperSize: v as SheetConfig["paperSize"] }));

  printButton.addEventListener("click", () => window.print());
}

function bindRadioGroup(
  group: NodeListOf<HTMLInputElement>,
  onChange: (value: string) => void,
): void {
  group.forEach((el) => {
    el.addEventListener("change", () => {
      if (el.checked) onChange(el.value);
    });
  });
}

function setRadio(group: NodeListOf<HTMLInputElement>, value: string): void {
  group.forEach((el) => {
    el.checked = el.value === value;
  });
}

function buildFormHtml(): string {
  const starterOptions = PRESETS
    .map((p) => `<option value="${p.key}">${p.label}</option>`)
    .join("");
  return `
    <h1>Worksheets</h1>
    <form id="config-form">
      <label class="field">
        <span class="field__label">Starter</span>
        <select id="starter">
          <option value="">Pick a starting point…</option>
          ${starterOptions}
        </select>
        <span class="field__hint">Loads a full configuration — tweak any control below after.</span>
      </label>

      <label class="field">
        <span class="field__label">Content</span>
        <textarea id="content" rows="6" spellcheck="false"></textarea>
      </label>

      <fieldset class="field">
        <legend>Page layout</legend>
        <label><input type="radio" name="layout" value="multi" /> Multiple items per page</label>
        <label><input type="radio" name="layout" value="single" /> One item per page</label>
      </fieldset>

      <fieldset class="field">
        <legend>Show demo</legend>
        <label><input type="radio" name="demo" value="yes" /> Yes</label>
        <label><input type="radio" name="demo" value="no" /> No</label>
      </fieldset>

      <fieldset class="field">
        <legend>Trace copies</legend>
        <label class="inline"><input type="radio" name="trace" value="0" /> 0</label>
        <label class="inline"><input type="radio" name="trace" value="1" /> 1</label>
        <label class="inline"><input type="radio" name="trace" value="2" /> 2</label>
        <label class="inline"><input type="radio" name="trace" value="3" /> 3</label>
      </fieldset>

      <fieldset class="field">
        <legend>Letter size</legend>
        <label><input type="radio" name="size" value="small" /> Small</label>
        <label><input type="radio" name="size" value="medium" /> Medium</label>
        <label><input type="radio" name="size" value="large" /> Large</label>
      </fieldset>

      <fieldset class="field">
        <legend>Theme</legend>
        <label><input type="radio" name="theme" value="none" /> None</label>
        <label><input type="radio" name="theme" value="enchanted" /> Enchanted</label>
        <label><input type="radio" name="theme" value="dinosaurs" /> Dinosaurs</label>
        <label><input type="radio" name="theme" value="vehicles" /> Cars + Planes</label>
      </fieldset>

      <fieldset class="field">
        <legend>Paper</legend>
        <label><input type="radio" name="paper" value="letter" /> US Letter</label>
        <label><input type="radio" name="paper" value="a4" /> A4</label>
      </fieldset>
    </form>

    <button id="print-btn" type="button" class="print-btn">Print</button>
    <p class="tip">
      Tip: use <em>Portrait</em> orientation and set margins to <em>None</em>.
      If your browser's print dialog shows a <em>Headers and footers</em>
      option, uncheck it — some browsers hide it automatically, others leave
      it on.
    </p>
  `;
}
