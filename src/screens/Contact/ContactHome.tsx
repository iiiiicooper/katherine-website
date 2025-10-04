import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { loadConfig } from "../../lib/config";

type ChatMessage = { id: string; author: "me" | "visitor"; text: string; time: string };

export const ContactHome = (): JSX.Element => {
  const cfg = React.useMemo(() => loadConfig(), []);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");

  const sendMessage = (): void => {
    if (!input.trim()) return;
    const msg: ChatMessage = {
      id: String(Date.now()),
      author: "visitor",
      text: input.trim(),
      time: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-10 py-10">
      <h1 className="text-3xl font-bold mb-6">联系我</h1>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>联系方式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">Email: <a className="underline" href={`mailto:${cfg.contact.email}`}>{cfg.contact.email}</a></div>
          <div className="text-sm">Phone: <a className="underline" href={`tel:${cfg.contact.phone}`}>{cfg.contact.phone}</a></div>
          <div className="text-sm">LinkedIn: <a className="underline" href={cfg.contact.linkedin} target="_blank" rel="noopener noreferrer">打开主页</a></div>
        </CardContent>
      </Card>

      <Card className="max-w-3xl mt-6">
        <CardHeader>
          <CardTitle>在线交流</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded p-3 h-64 overflow-y-auto space-y-2">
            {messages.length === 0 && <div className="text-sm text-muted-foreground">开始对话吧～</div>}
            {messages.map((m) => (
              <div key={m.id} className={m.author === "visitor" ? "text-right" : "text-left"}>
                <div className="inline-block bg-gray-100 rounded px-2 py-1 max-w-[80%]">
                  <div className="text-sm">{m.text}</div>
                  <div className="text-[10px] text-muted-foreground">{m.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="输入消息..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            />
            <Button onClick={sendMessage}>发送</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};