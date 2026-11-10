import { type MessageItem } from '../types';

interface MessageBubbleProps {
    message: MessageItem;
    currentUserId: string;
}

// Deterministic pastel-color generator, readable for any ID
function getPastelColorForUser(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = (hash << 5) - hash + userId.charCodeAt(i);
        hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 45%, 88%)`;
}

export default function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
    const isOwnMessage = message.userId === currentUserId;

    return (
        <div className={`message-row ${isOwnMessage ? 'own' : 'other'}`}>
            <div
                className="bubble-content"
                style={
                    isOwnMessage
                        ? { backgroundColor: '#ffffff' }
                        : { backgroundColor: getPastelColorForUser(message.userId) }
                }
            >
                {message.content}
            </div>
        </div>
    );
}