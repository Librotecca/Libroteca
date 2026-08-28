// Script minimo eseguito prima del paint per evitare il "flash" del tema sbagliato:
// legge la preferenza salvata (localStorage) e imposta subito l'attributo data-theme.
const SCRIPT = `
(function () {
  try {
    var salvato = localStorage.getItem('tema');
    if (salvato === 'light' || salvato === 'dark') {
      document.documentElement.setAttribute('data-theme', salvato);
    }
  } catch (e) {}
})();
`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
