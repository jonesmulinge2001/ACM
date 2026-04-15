import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmojiService {

  constructor() { }
  // Central emoji set (reuse everywhere)
  readonly emojis: string[] = [
    '😀','😂','😍','😎','😭','😡','👍','🙏',
    '🔥','🎉','❤️','🥺','😴','🤔','🙌','💯',
    '😇','😅','😬','😏','😤','😢','😜','😆'
  ];

  /**
   * Insert emoji into text
   */
  insertEmoji(currentText: string, emoji: string): string {
    return currentText + emoji;
  }

  /**
   * Optional: insert at cursor position (future upgrade)
   */
  insertAtCursor(text: string, emoji: string, cursorPos?: number): string {
    if (cursorPos === undefined) return text + emoji;

    return text.slice(0, cursorPos) + emoji + text.slice(cursorPos);
  }
}
