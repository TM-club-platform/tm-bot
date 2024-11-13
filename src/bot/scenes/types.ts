import { Context, Scenes } from "telegraf";

interface NameStep {
  type: "name";
  data: string;
}

interface AgeStep {
  type: "age";
  data: number;
}

type WizardStepData = NameStep | AgeStep;

export interface UserData {
  telegramId: number;
  name?: string;
  age?: number;
  occupation?: string;
  traits?: string[];
  hobbies?: string[];
  topics?: string[];
  countries?: string;
  info?: string;
  instagram?: string;
}

export interface WizardSession extends Scenes.WizardSessionData {
  selectedTraits: string[];
  selectedHobbies: string[];
  selectedTopics: string[];
  currentStep?: WizardStepData;
  [key: string]: any;
}

export interface SelectionContext extends WizardContext {
  match: RegExpExecArray;
}

export interface WizardContext extends Context {
  scene: any;
  wizard: {
    next: () => Promise<void>;
    selectStep: (step: number) => Promise<void>;
    state: {
      userData: UserData;
    };
  };
  session: WizardSession;
  inlineQuery: {
    query: string;
    id: string;
    offset: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
    };
  };
}
