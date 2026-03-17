'use client';

import { useState } from 'react';
import { Send, Paperclip, Image as ImageIcon, FileText } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui';

interface Message {
  id: string;
  sender: 'me' | 'sale' | 'tech';
  senderName: string;
  text: string;
  time: string;
  attachment?: { name: string; size: string };
}

const mockMessages: Message[] = [
  { id: '1', sender: 'sale', senderName: 'Sale: Nguyễn Hùng', text: 'Chào anh, em đã nhận PO nâng cấp RAM. Anh cần bàn giao máy vào ngày nào ạ?', time: '10:05' },
  { id: '2', sender: 'me', senderName: 'Tôi', text: 'Sáng thứ 4, 16/3 ổn không?', time: '10:07' },
  { id: '3', sender: 'tech', senderName: 'Tech: Lê Văn E', text: 'Anh ơi, em cần biết máy nào dùng mainboard H370 để chuẩn bị RAM DDR4 phù hợp.', time: '10:10' },
  { id: '4', sender: 'me', senderName: 'Tôi', text: 'Để em gửi danh sách spec máy ạ.', time: '10:12' },
  { id: '5', sender: 'me', senderName: 'Tôi', text: '', time: '10:13', attachment: { name: 'machine-specs.xlsx', size: '24KB' } },
];

export default function ChatB2B() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState('');
  const { addToast } = useToast();

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        sender: 'me',
        senderName: 'Tôi',
        text: input,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
        <h2 className="font-semibold text-gray-900">Chat hỗ trợ #T-0045</h2>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" />Sale: Nguyễn Hùng</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full" />Tech: Lê Văn E</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <EmptyState icon="chat" title="Chưa có tin nhắn" description="Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn." />
        ) : messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[75%]">
              {msg.sender !== 'me' && (
                <p className={`text-xs mb-1 font-medium ${msg.sender === 'sale' ? 'text-blue-600' : 'text-green-600'}`}>
                  {msg.senderName}
                </p>
              )}
              <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                msg.sender === 'me'
                  ? 'bg-[#0f172a] text-white rounded-br-md'
                  : msg.sender === 'sale'
                  ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                  : 'bg-green-50 border border-green-200 text-gray-800 rounded-bl-md'
              }`}>
                {msg.text}
                {msg.attachment && (
                  <div className="flex items-center gap-2 mt-1 p-2 bg-white/10 rounded-lg">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">{msg.attachment.name} · {msg.attachment.size}</span>
                  </div>
                )}
              </div>
              <p className={`text-xs text-gray-400 mt-1 ${msg.sender === 'me' ? 'text-right' : ''}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 lg:px-6 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => addToast('Tính năng đang phát triển', { type: 'info' })} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><Paperclip className="w-5 h-5" /></button>
          <button onClick={() => addToast('Tính năng đang phát triển', { type: 'info' })} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><ImageIcon className="w-5 h-5" /></button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Nhập tin nhắn..." className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          <button onClick={handleSend} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"><Send className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
}
