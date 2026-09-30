import { FormEvent, useState } from "react";

type Props = { value: string; placeholder: string; onSearch: (text: string) => void };

/** Busca ao enviar (Enter ou botão), não a cada tecla, para não disparar uma consulta por letra. */
export function SearchBox({ value, placeholder, onSearch }: Props) {
  const [text, setText] = useState(value);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch(text);
  }

  function clear() {
    setText("");
    onSearch("");
  }

  return (
    <form className="search" onSubmit={handleSubmit} role="search">
      <input value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
      <button type="submit" className="secondary">Buscar</button>
      {value && <button type="button" className="link" onClick={clear}>Limpar</button>}
    </form>
  );
}
