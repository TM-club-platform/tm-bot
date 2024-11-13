import { Markup } from "telegraf";

export function createInlineKeyboard(
  selectedTraits: string[],
  options: Array<{ label: string; name: string }>,
  doneButton: { label: string; name: string } = {
    label: "Готов!",
    name: "done",
  }
) {
  const buttons = options.map(({ label, name }) => [
    Markup.button.callback(
      (selectedTraits.includes(name) ? "✅ " : "") + label,
      name
    ),
  ]);

  buttons.push([Markup.button.callback(doneButton.label, doneButton.name)]);

  return Markup.inlineKeyboard(buttons.flat(), { columns: 2 });
}
