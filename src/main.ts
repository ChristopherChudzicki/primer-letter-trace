import { startApp } from "./ui/app";

startApp().catch((err) => {
  console.error(err);
  const preview = document.getElementById("preview");
  if (preview) {
    preview.innerHTML = `<pre style="color:red;padding:20px">${String(err)}</pre>`;
  }
});
