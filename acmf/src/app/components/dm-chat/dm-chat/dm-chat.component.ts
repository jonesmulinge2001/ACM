import { MaxLength } from 'class-validator';
import { RouterModule } from '@angular/router';
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, filter } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  Conversation,
  ConversationMessage,
  MessageAttachment,
  Post,
} from '../../../interfaces';
import {
  ConversationsService,
  FileUploadProgress,
} from '../../../services/conversations.service';
import { DmSocketService } from '../../../services/dm-socket.service';
import { TimeagoModule } from 'ngx-timeago';


interface AttachmentUI {
  file: File;
  previewUrl?: string;
  progress?: number;
  uploadedUrl?: string;
  type: 'IMAGE' | 'VIDEO' | 'FILE';
}

interface MessageAttachmentUI extends MessageAttachment {
  progress?: number;
  previewUrl?: string;
}

@Component({
  selector: 'app-dm-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TimeagoModule],
  templateUrl: './dm-chat.component.html',
  styleUrls: ['./dm-chat.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
 
})
export class DmChatComponent implements OnInit, OnDestroy {
  @Input() participantId?: string;
  @Input() conversationId?: string;
  @Output() close = new EventEmitter<void>();

  @ViewChild('messagesContainer')
  private messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  conversation?: Conversation;
  messages: ConversationMessage[] = [];
  newMessage: string = '';

  participantName: string = '';
  participantImage: string = '';
  myId!: string;

  private sub = new Subscription();
  selectedAttachments: AttachmentUI[] = [];
  isTyping: boolean = false;
  typingUsers: string[] = [];
  showNewMessageButton: boolean = false;
  currentUserId: string | null = null;
  menuOpen: Record<string, boolean> = {};

  showDeleteModal: boolean = false;
  messageToDelete: ConversationMessage | null = null;

  showEditModal: boolean = false;
  editedMessage: string = '';
  editingMessageId: string | null = null;

  replyingTo: ConversationMessage | null = null;
  isChatVisible: boolean = true;
  previewFile: { url: string; type: string; name: string } | null = null;

  activeEmojiPicker: string | null = null;

  maxMessageLength: number = 120; // determine readmore / readless
  // Emoji collections

  emojis: string[] = [
    // Smileys & Faces
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌',
    '😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓',
    '😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖',
    '😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱',
    '😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄',
    '😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮',
    '🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀',
    '☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
    
    // Gestures & Body Parts
    '👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','✋',
    '🤚','🖐️','🖖','👋','🤙','💪','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴',
    '👀','👁️','👅','👄','💋','🫂','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿',
    
    // Hearts & Emotions
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓',
    '💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️',
    '☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒',
    '♓','🆔','⚛️',
    
    // Animals & Nature
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷',
    '🐸','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🐺','🐗','🐴','🦄','🐝',
    '🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🕸️','🦂','🐢','🐍','🦎',
    '🐙','🦑','🦐','🦞','🐠','🐟','🐡','🐬','🐳','🐋','🦈','🐊','🐅',
    '🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂',
    '🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈',
    '🐈⬛','🐓','🦃','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦦',
    '🦥','🐁','🐀','🐿️','🦔',
    
    // Food & Drink
    '🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥',
    '🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔',
    '🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗'
    ,'🍖','🦴','🌭','🍔','🍟','🍕','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕',
    '🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢',
    '🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🧂','🥫','🍼',
    '🥛','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾',
    
    // Activities & Travel
    '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑',
    '🥍','🏏','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','⛸️','🎿','⛷️'
    ,'🏂','🏋️','🤼','🤸','⛹️','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🏊‍♂️','🏊‍♀️','🧗',
    '🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🤹','🎭','🎨',
    '🎬','🎤','🎧','🎷','🎸','🎹','🎺','🎻','🥁','🪘','🎲','♟️','🎯','🎳','🎮','🎰','🧩',
    
    // Travel & Places
    '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🏍️','🛵','🚲',
    '🛴','🛹','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈',
    '🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤',
    '🛥️','🛳️','⛴️','🚢','⚓','⛽','🚧','🚦','🚥','🚏','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡',
    '🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🏠','🏡','🏘️','🏚️',
    '🏗️','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🕍',
    '🛕','🕋','⛩️',
    
    // Objects & Symbols
    '⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸',
    '📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏰','⏲️','⏱️','🕰️'
    ,'⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','💰','💳','💎'
    ,'⚖️','🔧','🔨','⚒️','🛠️','⛏️','🔩','⚙️','⛓️','🧲','🔫','💣','🧨','🔪','🗡️','⚔️','🛡️','🚬',
    '⚰️','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳️','💊','💉','🩸','🩹','🩺','🌡️','🧹','🧺',
    '🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪒','🧽','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🛌','🖼️',
    '🛍️','🎁','🎈','🎏','🎀','🎄','🎃','🎗️','🎟️','🎫','🎖️','🏆','🏅','🥇','🥈','🥉',
    
    // Flags & Nation
    '🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇺🇳','🇦🇫','🇦🇽','🇦🇱','🇩🇿','🇦🇸','🇦🇩','🇦🇴','🇦🇮','🇦🇶','🇦🇬','🇦🇷',
    '🇦🇲','🇦🇼','🇦🇺','🇦🇹','🇦🇿','🇧🇸','🇧🇭','🇧🇩','🇧🇧','🇧🇾','🇧🇪','🇧🇿','🇧🇯','🇧🇲','🇧🇹','🇧🇴','🇧🇦','🇧🇼','🇧🇷','🇮🇴','🇻🇬',
    '🇧🇳','🇧🇬','🇧🇫','🇧🇮','🇰🇭','🇨🇲','🇨🇦','🇮🇨','🇨🇻','🇧🇶','🇰🇾','🇨🇫','🇹🇩','🇨🇱','🇨🇳','🇨🇽','🇨🇨','🇨🇴','🇰🇲','🇨🇬','🇨🇩',
    '🇨🇰','🇨🇷','🇨🇮','🇭🇷','🇨🇺','🇨🇼','🇨🇾','🇨🇿','🇩🇰','🇩🇯','🇩🇲','🇩🇴','🇪🇨','🇪🇬','🇸🇻','🇬🇶','🇪🇷','🇪🇪','🇪🇹','🇪🇺','🇫🇰','🇫🇴'
    ,'🇫🇯','🇫🇮','🇫🇷','🇬🇫','🇵🇫','🇹🇫','🇬🇦','🇬🇲','🇬🇪','🇩🇪','🇬🇭','🇬🇮','🇬🇷','🇬🇱','🇬🇩','🇬🇵','🇬🇺','🇬🇹','🇬🇬','🇬🇳','🇬🇼','🇬🇾'
    ,'🇭🇹','🇭🇳','🇭🇰','🇭🇺','🇮🇸','🇮🇳','🇮🇩','🇮🇷','🇮🇶','🇮🇪','🇮🇲','🇮🇱','🇮🇹','🇯🇲','🇯🇵','🎌','🇯🇪','🇯🇴','🇰🇿','🇰🇪','🇰🇮','🇽🇰',
    '🇰🇼','🇰🇬','🇱🇦','🇱🇻','🇱🇧','🇱🇸','🇱🇷','🇱🇾','🇱🇮','🇱🇹','🇱🇺','🇲🇴','🇲🇬','🇲🇼','🇲🇾','🇲🇻','🇲🇱','🇲🇹','🇲🇭','🇲🇶','🇲🇷',
    '🇲🇺','🇾🇹','🇲🇽','🇫🇲','🇲🇩','🇲🇨','🇲🇳','🇲🇪','🇲🇸','🇲🇦','🇲🇿','🇲🇲','🇳🇦','🇳🇷','🇳🇵','🇳🇱','🇳🇨','🇳🇿','🇳🇮','🇳🇪','🇳🇬',
    '🇳🇺','🇳🇫','🇰🇵','🇲🇰','🇲🇵','🇳🇴','🇴🇲','🇵🇰','🇵🇼','🇵🇸','🇵🇦','🇵🇬','🇵🇾','🇵🇪','🇵🇭','🇵🇳','🇵🇱','🇵🇹','🇵🇷','🇶🇦','🇷🇪','🇷🇴',
    '🇷🇺','🇷🇼','🇧🇱','🇸🇭','🇰🇳','🇱🇨','🇵🇲','🇻🇨','🇼🇸','🇸🇲','🇸🇹','🇸🇦','🇸🇳','🇷🇸','🇸🇨','🇸🇱','🇸🇬','🇸🇽','🇸🇰','🇸🇮','🇬🇸','🇸🇧','🇸🇴',
    '🇿🇦','🇰🇷','🇸🇸','🇪🇸','🇱🇰','🇸🇩','🇸🇷','🇸🇯','🇸🇿','🇸🇪','🇨🇭','🇸🇾','🇹🇼','🇹🇯','🇹🇿','🇹🇭','🇹🇱','🇹🇬','🇹🇰','🇹🇴','🇹🇹','🇹🇳','🇹🇷','🇹🇲',
    '🇹🇨','🇹🇻','🇺🇬','🇺🇦','🇦🇪','🇬🇧','🇺🇸','🇻🇮','🇺🇾','🇺🇿','🇻🇺','🇻🇦','🇻🇪','🇻🇳','🇼🇫','🇪🇭','🇾🇪','🇿🇲','🇿🇼',
    
    // Additional Symbols & Pictographs
    '🔟','🔠','🔡','🔢','🔣','🔤','🅰️','🆎','🅱️','🆑','🆒','🆓','ℹ️','🆔','Ⓜ️','🆕','🆖','🅾️',
    '🆗','🅿️','🆘','🆙','🆚','🈁','🈂️','🈷️','🈶','🈯','🉐','🈹','🈚','🈲','🉑','🈸','🈴','🈳',
    '㊗️','㊙️','🈺','🈵','🔴','🟠','🟡','🟢','🔵','🟣','🟤','⚫','⚪','🟥','🟧','🟨','🟩','🟦',
    '🟪','🟫','⬛','⬜','◼️','◻️','◾','◽','▪️','▫️','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘','🔳','🔲',
    '🏴‍☠️'
  ];

  constructor(
    private convos: ConversationsService,
    private socket: DmSocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log(
      'conversationId:',
      this.conversationId,
      'participantId:',
      this.participantId
    );

    this.myId = localStorage.getItem('userId')!;
    this.socket.connect();

    if (this.conversationId) this.loadConversation(this.conversationId);
    else if (this.participantId) this.createOrLoadConversation();

    this.sub.add(
      this.socket.onTyping().subscribe((event) => {
        if (
          this.conversation &&
          event.conversationId === this.conversation.id
        ) {
          if (event.userId !== this.myId) {
            this.typingUsers = event.typing
              ? [event.userId]
              : this.typingUsers.filter((id) => id !== event.userId);
            this.cdr.markForCheck();
            if (this.isNearBottom()) this.scrollToBottom();
            else this.showNewMessageButton = true;
          }
        }
      })
    );
  }

  private createOrLoadConversation() {
    this.sub.add(
      this.convos.createOneOnOne(this.participantId!).subscribe((convo) => {
        this.conversation = convo;
        this.setupParticipantInfo(convo);
        this.joinAndLoad(convo.id);
      })
    );
  }

  private loadConversation(convoId: string) {
    this.sub.add(
      this.convos.getConversation(convoId).subscribe((convo) => {
        this.conversation = convo;
        this.setupParticipantInfo(convo);
        this.joinAndLoad(convo.id);
      })
    );
  }

  private setupParticipantInfo(convo: Conversation): void {
    console.log('Conversation participants:', convo.participants);
    console.log('My ID:', this.myId);

    const other = convo.participants.find((p) => {
      return p.id.toString() !== this.myId.toString();
    });

    console.log('Other participant found:', other);

    if (other) {
      this.participantName = other.name || 'Unknown User';
      this.participantImage =
        other.profileImage || 'https://via.placeholder.com/40';
    } else {
      this.participantName = 'User';
      this.participantImage = 'https://via.placeholder.com/40';
    }

    console.log('Participant info set:', {
      name: this.participantName,
      image: this.participantImage,
    });

    this.cdr.markForCheck();
  }

  private joinAndLoad(convoId: string) {
    this.socket.join(convoId);

    this.sub.add(
      this.convos.getMessages(convoId).subscribe((msgs) => {
        this.messages = msgs.reverse();
        this.cdr.markForCheck();
      })
    );

    this.sub.add(
      this.socket.onMessage().subscribe((msg) => {
        if (!this.conversation) return;
        if (msg.conversationId.toString() === this.conversation.id.toString()) {
          this.messages = [...this.messages, msg];
          this.cdr.markForCheck();
        }
      })
    );

    this.sub.add(
      this.socket.onTyping().subscribe((event) => {
        if (!this.conversation) return;
        if (
          event.conversationId.toString() === this.conversation.id.toString()
        ) {
          const userId = event.userId;
          this.typingUsers = event.typing
            ? [...new Set([...this.typingUsers, userId])]
            : this.typingUsers.filter((id) => id !== userId);
          this.cdr.markForCheck();
        }
      })
    );
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const newAttachments: AttachmentUI[] = Array.from(input.files).map(
      (file) => {
        let previewUrl: string | undefined;
        let type: 'IMAGE' | 'VIDEO' | 'FILE' = 'FILE';
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
          type = 'IMAGE';
        } else if (file.type.startsWith('video/')) {
          previewUrl = URL.createObjectURL(file);
          type = 'VIDEO';
        }
        return { file, previewUrl, type, progress: 0 };
      }
    );

    this.selectedAttachments.push(...newAttachments);
    this.cdr.markForCheck();
  }

  removeAttachment(index: number) {
    const att = this.selectedAttachments[index];
    if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
    this.selectedAttachments.splice(index, 1);
    this.cdr.markForCheck();
  }

  openFilePreview(attachment: MessageAttachment) {
    this.previewFile = {
      url: attachment.url,
      type: attachment.type,
      name: attachment.name,
    };
    this.cdr.markForCheck();
  }

  closeFilePreview() {
    if (this.previewFile) {
      this.previewFile = null;
      this.cdr.markForCheck();
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() && this.selectedAttachments.length === 0)
      return;
    if (!this.conversation) return;

    const convoId = this.conversation.id;
    const content = this.newMessage.trim();
    const files = this.selectedAttachments.map((a) => a.file);

    const tempMsg: ConversationMessage = {
      id: 'temp-' + Date.now(),
      conversationId: convoId,
      content,
      attachments: this.selectedAttachments.map((a) => ({
        name: a.file.name,
        type: a.file.type,
        url: a.previewUrl || '',
        progress: 0,
      })) as MessageAttachmentUI[],
      createdAt: new Date().toISOString(),
      senderId: this.myId,
      sender: {
        id: this.myId,
        name: 'You',
        profileImage: localStorage.getItem('profileImage') || undefined,
      },
    };

    this.messages = [...this.messages, tempMsg];
    this.newMessage = '';
    this.selectedAttachments = [];
    this.cdr.markForCheck();
    this.scrollToBottom();

    this.socket.sendMessage({
      conversationId: convoId,
      content,
    });

    this.sub.add(
      this.convos
        .sendMessageWithFiles(convoId, content, files, (progress) => {
          tempMsg.attachments?.forEach((a) => (a.progress = progress));
          this.cdr.markForCheck();
        })
        .subscribe({
          next: (saved) => {
            this.messages = this.messages.map((m) =>
              m.id === tempMsg.id ? saved : m
            );
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('[DmChat] sendMessage error', err);
            this.messages = this.messages.filter((m) => m.id !== tempMsg.id);
            this.cdr.markForCheck();
          },
        })
    );

    this.socket.sendTyping(convoId, false);
  }

  onInputChange() {
    if (!this.conversation) return;
    const typing = !!this.newMessage.trim();
    if (typing !== this.isTyping) {
      this.isTyping = typing;
      this.socket.sendTyping(this.conversation.id, typing);
    }
  }

  ngOnDestroy(): void {
    if (this.conversation) this.socket.leave(this.conversation.id);
    this.sub.unsubscribe();

    this.selectedAttachments.forEach((a) => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.showNewMessageButton = false;
      this.cdr.markForCheck();
    }, 50);
  }

  private isNearBottom(): boolean {
    const ele = this.messagesContainer.nativeElement;
    const threshold = 100;
    return ele.scrollHeight - ele.scrollTop - ele.clientHeight < threshold;
  }

  jumpToBottom() {
    this.scrollToBottom();
  }

  isMyMessage(m: ConversationMessage): boolean {
    return m.senderId.toString() === this.myId;
  }

  toggleMenu(id: string) {
    this.menuOpen[id] = !this.menuOpen[id];
    this.cdr.markForCheck();
  }

  closeAllMenus() {
    this.menuOpen = {};
    this.cdr.markForCheck();
  }

  openEditModal(message: ConversationMessage) {
    if (message.senderId.toString() !== this.myId) return;
    this.closeAllMenus();
    this.editedMessage = message.content;
    this.editingMessageId = message.id;
    this.showEditModal = true;
    this.cdr.markForCheck();
  }

  cancelEdit() {
    this.showEditModal = false;
    this.editedMessage = '';
    this.editingMessageId = null;
    this.cdr.markForCheck();
  }

  saveEdit() {
    if (!this.editingMessageId || !this.editedMessage.trim()) return;
    const updatedContent = this.editedMessage.trim();

    this.convos.editMessage(this.editingMessageId, updatedContent).subscribe({
      next: (res) => {
        const idx = this.messages.findIndex(
          (m) => m.id === this.editingMessageId
        );
        if (idx !== -1) this.messages[idx] = { ...res };
        this.cancelEdit();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Edit failed', err);
        this.cancelEdit();
      },
    });
  }

  openDeleteModal(message: ConversationMessage) {
    if (message.senderId.toString() !== this.myId) return;
    this.closeAllMenus();
    this.messageToDelete = message;
    this.showDeleteModal = true;
    this.cdr.markForCheck();
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.messageToDelete = null;
    this.cdr.markForCheck();
  }

  confirmDelete() {
    if (!this.messageToDelete) return;
    this.convos.deleteMessage(this.messageToDelete.id).subscribe({
      next: () => {
        this.messages = this.messages.filter(
          (m) => m.id !== this.messageToDelete?.id
        );
        this.showDeleteModal = false;
        this.messageToDelete = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Delete Failed');
        this.cancelDelete();
      },
    });
  }

  replyToMessage(message: ConversationMessage) {
    this.replyingTo = message;
  }

  cancelReply() {
    this.replyingTo = null;
  }

  isMenuOpen(id: string): boolean {
    return !!this.menuOpen[id];
  }

  closeMenu(id?: string) {
    if (id) {
      this.menuOpen[id] = false;
    } else {
      this.menuOpen = {};
    }
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const clickedInsideMenu = target.closest('.dm-menu, .dm-menu-btn');
    if (!clickedInsideMenu) {
      this.closeAllMenus();
    }
  }

  // check if message needs read more
  shouldShowReadMore(content: string): boolean {
    return !!content && content.length > this.maxMessageLength;
  }

  // get displayed text
  getMessageDisplay(content: string, messageId: string): string {
    if (!this.shouldShowReadMore(content)) return content;

    return this.expandedMessages[messageId]
      ? content
      : content.substring(0, this.maxMessageLength) + '...';
  }

  // track expanded messages per message
  expandedMessages: Record<string, boolean> = {};

  // toggle
  toggleReadMore(messageId: string): void {
    const current = this.expandedMessages[messageId] ?? false;
    this.expandedMessages[messageId] = !current;
    this.cdr.markForCheck();
  }

 
  addEmoji(emoji: string) {
    this.newMessage += emoji;
    this.activeEmojiPicker = null; // auto-close picker
    this.cdr.markForCheck();
  }

  toggleEmojiPicker(target: string = 'input'): void {
    this.activeEmojiPicker =
      this.activeEmojiPicker === target ? null : target;
  
    this.cdr.markForCheck();
  }
}
