export const WIZARD_CONSTANTS = {
  MAX_TRAITS: 4,
  MAX_HOBBIES: 4,
  MAX_TOPICS: 4,
  MAX_OCCUPATION_LENGTH: 80,
  MESSAGES: {
    START: "Отлично, ответь на следующие вопросы:\nКак тебя зовут?",
    INVALID_AGE: "Пожалуйста, введите корректный возраст цифрами",
    MAX_TRAITS_REACHED: "Достигнуто максимальное количество выбранных пунктов.",
    NO_TRAITS_SELECTED: "Вы не выбрали ни одного вайба",
    MAX_HOBBIES_REACHED:
      "Достигнуто максимальное количество выбранных пунктов.",
    NO_HOBBIES_SELECTED: "Вы не выбрали ни одного хобби",
    MAX_TOPICS_REACHED: "Достигнуто максимальное количество выбранных пунктов.",
    NO_TOPICS_SELECTED: "Вы не выбрали ни одного интереса",
  },
  BUTTONS: {
    DONE_TRAITS: {
      label: "Готово!",
      name: "done-traits",
    },
    DONE_HOBBIES: {
      label: "Готово!",
      name: "done-hobbies",
    },
    DONE: {
      label: "Готово!",
      name: "done",
    },
  },
} as const;

export const COUNTRIES = [
  { name: "Thailand", code: "TH", emoji: "🇹🇭" },
  { name: "Indonesia", code: "ID", emoji: "🇮🇩" },
  { name: "Vietnam", code: "VN", emoji: "🇻🇳" },
  { name: "Singapore", code: "SG", emoji: "🇸🇬" },
  { name: "Malaysia", code: "MY", emoji: "🇲🇾" },
  // Add more countries as needed
] as const;
