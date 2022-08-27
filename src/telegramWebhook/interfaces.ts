export interface ITelegramUpdate {
  message?: ITelegramMessage;

  callback_query?: {
    message: ITelegramMessage;
    data: string;
  };
}

interface ITelegramMessage {
  text: string;
  chat: ITelegramChat;
  entities?: ITelegramEntity[];
}

interface ITelegramEntity {
  type: 'bot_command';
}

interface ITelegramChat {
  id: number;
}

interface ICallbackButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export type Tbuttons = ICallbackButton[][] | null;
export type replyFunc = (text: string, buttons?: Tbuttons) => void;
