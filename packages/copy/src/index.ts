import cn from "./data/cn.json" assert { type: "json" };

export async function copy() {
  const messages = cn.messages;
  const message = messages[Math.floor(Math.random() * messages.length)];
  return message;
}
