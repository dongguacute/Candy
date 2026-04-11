import cn from "./data/cn.json" assert { type: "json" };
import en from "./data/en.json" assert { type: "json" };

export async function copy(lang: "cn" | "en" = "cn") {
  const messages = lang === "en" ? en.messages : cn.messages;
  const message = messages[Math.floor(Math.random() * messages.length)];
  return message;
}
