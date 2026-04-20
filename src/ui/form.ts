import type { SheetConfig } from "../config/types";
import type { Store } from "../state/store";
import { parseContent, presetToText, PresetKey } from "../config/content";

export function bindForm(root: HTMLElement, store: Store<SheetConfig>): void {
  root.innerHTML = FORM_HTML;

  const contentField = root.querySelector<HTMLTextAreaElement>("#content")!;
  const layoutGroup = root.querySelectorAll<HTMLInputElement>("input[name='layout']");
  const rowGroup = root.querySelectorAll<HTMLInputElement>("input[name='row']");
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
    setRadio(rowGroup, config.rowStyle);
    setRadio(sizeGroup, config.size);
    setRadio(themeGroup, config.theme);
    setRadio(paperGroup, config.paperSize);
  });

  contentField.addEventListener("input", () => {
    store.update({ content: parseContent(contentField.value) });
  });

  bindRadioGroup(layoutGroup, (v) => store.update({ layout: v as SheetConfig["layout"] }));
  bindRadioGroup(rowGroup, (v) => store.update({ rowStyle: v as SheetConfig["rowStyle"] }));
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
      <legend>Row style</legend>
      <label><input type="radio" name="row" value="combo" /> Combo (demo + trace + blank)</label>
      <label><input type="radio" name="row" value="all-trace" /> Trace + blank</label>
      <label><input type="radio" name="row" value="demo-blank" /> Demo + blank</label>
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
      <label><input type="radio" name="theme" value="fairy" /> Fairy</label>
      <label><input type="radio" name="theme" value="unicorn" /> Unicorn</label>
      <label><input type="radio" name="theme" value="princess" /> Princess</label>
    </fieldset>

    <fieldset class="field">
      <legend>Paper</legend>
      <label><input type="radio" name="paper" value="letter" /> US Letter</label>
      <label><input type="radio" name="paper" value="a4" /> A4</label>
    </fieldset>
  </form>

  <button id="print-btn" type="button" class="print-btn">Print</button>
  <p class="tip">
    Tip: in the print dialog, uncheck <em>Headers and footers</em> and
    set margins to <em>None</em> or <em>Default</em> for cleanest output.
  </p>
`;
