import { useState, type SyntheticEvent } from 'react';

interface ChatFormProps {
    onSendMessage: (content: string) => Promise<void>;
}

export default function ChatForm({ onSendMessage }: ChatFormProps) {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = content.trim();
        if (!trimmed || isSending) return;

        try {
            setIsSending(true);
            await onSendMessage(trimmed);
            setContent('');
        } catch (err: unknown) {
            console.error(err);
            alert('Ошибка при отправке сообщения');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="chat-form">
            <input
                type="text"
                name="chatMessage"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSending}
                placeholder={isSending ? 'Отправка...' : 'Напишите сообщение...'}
                className="chat-input"
                autoComplete="off"
                required
            />
            <button
                type="submit"
                disabled={isSending || !content.trim()}
                className="chat-send-btn"
                title="Отправить"
            >
                {isSending ? '⏳' : '➤'}
            </button>
        </form>
    );
}