import type { SheetConfig } from "../config/types";
import type { Store } from "../state/store";
import { parseContent, presetToText, PresetKey } from "../config/content";

export function bindForm(root: HTMLElement, store: Store<SheetConfig>): void {
  root.innerHTML = FORM_HTML;

  const contentField = root.querySelector<HTMLTextAreaElement>("#content")!;
  const layoutGroup = root.querySelectorAll<HTMLInputElement>("input[name='layout']");
  const demoGroup = root.querySelectorAll<HTMLInputElement>("input[name='demo']");
  const traceGroup = root.querySelectorAll<HTMLInputElement>("input[name='trace']");
  const sizeGroup = root.querySelectorAll<HTMLInputElement>("input[name='size']");
  const themeGroup = root.querySelectorAll<HTMLInputElement>("input[name='theme']");
  const paperGroup = root.querySelectorAll<HTMLInputElement>("input[name='paper']");
  const presetButtons = root.querySelectorAll<HTMLButtonElement>("button[data-preset]");
  const printButton = root.querySelector<HTMLButtonElement>("#print-btn")!;

  store.run((config) => {
    const desired = config.content.join(" ");
    if (parseContent(contentField.value).join(" ") !== desired) {
      contentField.value = desired;
    }
    setRadio(layoutGroup, config.layout);
    setRadio(demoGroup, config.showDemo ? "yes" : "no");
    setRadio(traceGroup, String(config.traceCount));
    setRadio(sizeGroup, config.size);
    setRadio(themeGroup, config.theme);
    setRadio(paperGroup, config.paperSize);
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

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.dataset.preset as PresetKey | undefined;
      if (!preset) return;
      store.update({ content: parseContent(presetToText(preset)) });
    });
  });

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

const FORM_HTML = `
  <h1>Worksheets</h1>
  <form id="config-form">
    <label class="field">
      <span class="field__label">Content</span>
      <textarea id="content" rows="3" spellcheck="false"></textarea>
      <div class="presets">
        <button type="button" data-preset="uppercase">A–Z</button>
        <button type="button" data-preset="lowercase">a–z</button>
        <button type="button" data-preset="pairs">Aa–Zz</button>
        <button type="button" data-preset="digits">0–9</button>
      </div>
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
    Tip: in the print dialog, use <em>Portrait</em> orientation,
    set margins to <em>None</em>, and uncheck <em>Headers and footers</em>
    for cleanest output.
  </p>
`;
