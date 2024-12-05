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
    MAX_LOCATION_REACHED: "Можно выбрать только одну локацию",
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
    DONE_COUNTRY: {
      label: "Подтвердить страну",
      name: "done-country",
    },
    DONE_DISTRICT: {
      label: "Подтвердить район",
      name: "done-district",
    },
  },
} as const;

export const COUNTRIES = [
  {
    label: "🇹🇭 Таиланд",
    name: "country-thailand",
    districts: [
      { label: "Бангкок", name: "district-bangkok" },
      { label: "Пхукет", name: "district-phuket" },
      { label: "Самуи", name: "district-samui" },
    ],
  },
  {
    label: "🇮🇩 Бали",
    name: "country-bali",
    districts: [
      { label: "Чангу", name: "district-canggu" },
      { label: "Убуд", name: "district-ubud" },
      { label: "Семиньяк", name: "district-seminyak" },
    ],
  },
];
