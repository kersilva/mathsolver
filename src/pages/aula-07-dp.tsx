import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { solveDp, type DpItem, type Cell } from "@/lib/knapsack-dp";

const INITIAL: DpItem[] = [
  { p: 3, v: 5 },
  { p: 4, v: 7 },
  { p: 2, v: 4 },
  { p: 6, v: 11 },
  { p: 5, v: 8 },
  { p: 3, v: 6 },
];

type HotAxis = { kind: "row" | "col"; idx: number } | null;
type CellCoord = { i: number; b: number } | null;

const toNum = (s: string) => Math.max(1, Number(s) || 1);

const juntar = (xs: number[]) =>
  xs.length <= 1
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}`;

// Extrai condições como "p1 = 3 ≤ 3 →" ou "p3 <= 12" e remove do texto visível
function processarCondicao(
  rawCalc: string,
  i: number,
  b: number,
  item: DpItem | undefined,
): { contaLimpa: string; tooltipText: string } {
  const encontradas: string[] = [];

  let semCondicao = rawCalc.replace(
    /\b(p\d+\s*=\s*\d+\s*(?:≤|≥|<=|>=|<|>)\s*\d+)\s*(?:→|->|,)?\s*/gi,
    (_, cond) => {
      encontradas.push(String(cond).trim());
      return "";
    },
  );

  semCondicao = semCondicao.replace(
    /(?:^|[,;(–—-]\s*|\s+)(p(?:[0-9]+|ᵢ|i)?\s*(?:<=|>=|≤|≥|<|>)\s*(?:[0-9]+|b))\s*(?:[);,→]|->|$)/gi,
    (full, cond) => {
      encontradas.push(String(cond).trim());
      return full.startsWith(",") ? "" : " ";
    },
  );

  semCondicao = semCondicao
    .replace(/^\s*(?:→|->|[,;:\-–—]+)\s*/, "")
    .replace(/\s*[,;:\-–—]+\s*$/, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const p = item?.p ?? 0;
  const condicaoPadrao = p <= b ? `p${i} = ${p} ≤ ${b}` : `p${i} = ${p} > ${b}`;
  const tooltipText =
    encontradas.length > 0 ? encontradas.join(" · ") : condicaoPadrao;

  return { contaLimpa: semCondicao, tooltipText };
}

// Substitui T[r,c] e v_k pelos valores numéricos dentro da expressão da conta
function formatarContaComValores(
  contaLimpa: string,
  cell: Cell,
  table: Cell[][],
  items: DpItem[],
): string {
  const getCellVal = (r: number, col: number) => table[r]?.[col]?.value ?? 0;

  const item = items[cell.i - 1];
  const p = item?.p ?? 0;
  const v = item?.v ?? 0;

  const prevI = Math.max(0, cell.i - 1);
  const prevB = cell.b - p;

  // Cálculo do max: remove as igualdades intermediárias
  if (
    !contaLimpa ||
    /\bmax\s*\(/i.test(contaLimpa) ||
    /\b[pi]i\b|\bb\s*-\s*pi\b/i.test(contaLimpa)
  ) {
    const semItem = getCellVal(prevI, cell.b);
    const valorAnterior = getCellVal(prevI, Math.max(0, prevB));

    return `max(${semItem}, ${valorAnterior} + ${v}) = ${cell.value}`;
  }

  let texto = contaLimpa;

  // T[r,c] = valor -> valor
  texto = texto.replace(
    /T\[\s*(\d+)\s*,\s*(\d+)\s*\]\s*=\s*(-?\d+)/g,
    (_, _r, _c, val) => val,
  );

  // T[r,c] -> valor da célula
  texto = texto.replace(/T\[\s*(\d+)\s*,\s*(\d+)\s*\]/g, (_, r, col) =>
    String(getCellVal(Number(r), Number(col))),
  );

  // Remove igualdades intermediárias: "15 + 6 = 21" -> "15 + 6"
  texto = texto.replace(/(\d+(?:\s*[+\-*/]\s*\d+)+)\s*=\s*-?\d+/g, "$1");

  // Remove igualdade de valores isolados: "20 = 20" -> "20"
  texto = texto.replace(/(\d+)\s*=\s*\1/g, "$1");

  // v_k = valor -> valor
  texto = texto.replace(/\bv\s*[_0-9ᵢi]\s*=\s*(-?\d+)/gi, (_, val) => val);

  // v_k -> valor do item atual
  texto = texto.replace(/\bv\s*[_0-9ᵢi]+\b/gi, String(v));

  return texto;
}

// Renderiza um texto destacando ocorrências de T[i,b] com hover sincronizado à tabela
function renderComRefsCelula(
  texto: string,
  hotCell: CellCoord,
  setHotCell: (c: CellCoord) => void,
): ReactNode[] {
  const regex = /T\[\s*(\d+)\s*,\s*(\d+)\s*\]/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(texto)) !== null) {
    if (m.index > lastIndex) {
      parts.push(texto.slice(lastIndex, m.index));
    }
    const i = Number(m[1]);
    const b = Number(m[2]);
    const active = hotCell?.i === i && hotCell?.b === b;

    parts.push(
      <span
        key={`${m.index}-${i}-${b}`}
        onMouseEnter={() => setHotCell({ i, b })}
        onMouseLeave={() => setHotCell(null)}
        className={`cursor-pointer rounded px-1 py-0.5 font-mono transition-colors ${
          active
            ? "bg-sky-500/30 font-bold text-sky-200 ring-1 ring-sky-400/70"
            : "bg-muted/70 text-emerald-400 hover:bg-sky-500/20"
        }`}
      >
        {m[0]}
      </span>,
    );

    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < texto.length) {
    parts.push(texto.slice(lastIndex));
  }

  return parts;
}

export function DpPage() {
  const [items, setItems] = useState<DpItem[]>(INITIAL);
  const [capacity, setCapacity] = useState("12");
  const [result, setResult] = useState(() => solveDp(INITIAL, 12));
  const [calculado, setCalculado] = useState(true);

  const [hotAxis, setHotAxis] = useState<HotAxis>(null);
  const [hotValue, setHotValue] = useState<number | null>(null);
  const [hotCell, setHotCell] = useState<CellCoord>(null);
  const [hoveredCalcKey, setHoveredCalcKey] = useState<string | null>(null);

  const [mostrarApenasDistintos, setMostrarApenasDistintos] = useState(true);

  const reconstrução = (() => {
    const visitadas = new Set<string>();
    const selecionadas = new Set<string>();
    const origens = new Set<string>();

    const transicoes = new Map<string, number>();

    const tabela = result.table;
    let i = tabela.length - 1;
    let b = Math.max(...tabela[0].map((c) => c.b));

    while (i > 0) {
      const atual = tabela[i].find((c) => c.b === b);
      const acima = tabela[i - 1].find((c) => c.b === b);

      if (!atual || !acima) break;

      const atualKey = `${i}-${b}`;
      const acimaKey = `${i - 1}-${b}`;

      visitadas.add(atualKey);

      // O valor veio da linha anterior: não selecionou item.
      if (atual.value === acima.value) {
        visitadas.add(acimaKey);
        i--;
        continue;
      }

      // O valor aumentou: o item da linha atual foi selecionado.
      const item = items[i - 1];

      if (!item) break;

      const capacidadeAnterior = b - item.p;
      const origemKey = `${i - 1}-${capacidadeAnterior}`;

      selecionadas.add(atualKey);
      visitadas.add(origemKey);
      origens.add(origemKey);

      transicoes.set(atualKey, capacidadeAnterior);

      b = capacidadeAnterior;
      i--;
    }

    return {
      visitadas,
      selecionadas,
      origens,
      transicoes,
    };
  })();

  const colunasReconstrucao = (() => {
    if (!hotCell) return new Set<number>();

    const key = `${hotCell.i}-${hotCell.b}`;
    const origem = reconstrução.transicoes.get(key);

    if (origem === undefined) return new Set<number>();

    return new Set([hotCell.b, origem]);
  })();

  const update = (i: number, patch: Partial<DpItem>) =>
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    );
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const add = () => setItems([...items, { p: 1, v: 100 }]);
  const calculate = () => {
    setResult(solveDp(items, Number(capacity) || 0));
    setCalculado(true);
  };

  const isHotAxis = (kind: "row" | "col", idx: number) =>
    hotAxis?.kind === kind && hotAxis.idx === idx;

  const onPath = new Set(result.path.map((c) => `${c.i},${c.b}`));

  // Mapeia cada valor distinto da linha ou coluna ativa para um índice 0, 1, 2...
  // Assim, valores iguais recebem exatamente a mesma alternância cor sim / cor não.
  const axisValueParity = new Map<number, number>();
  if (hotAxis) {
    const axisCells =
      hotAxis.kind === "row"
        ? (result.table[hotAxis.idx] ?? [])
        : result.table.map((row) => row[hotAxis.idx]).filter(Boolean);

    let rank = 0;
    for (const cell of axisCells) {
      if (!axisValueParity.has(cell.value)) {
        axisValueParity.set(cell.value, rank++);
      }
    }
  }

  // Só valores novos e apenas a primeira conta para cada resultado (c.value) distinto.
  const resultadosVistos = new Set<number>();

  // Todas as células que geraram um valor novo
  const todosNovos = result.table
    .slice(1)
    .flatMap((row) => row.slice(1))
    .filter((c) => c.kind === "compara" && c.take !== null && c.take > c.prev);

  // Filtra resultados distintos somente se o checkbox estiver ativado
  const novos = mostrarApenasDistintos
    ? todosNovos.filter((c, index, array) => {
        return array.findIndex((item) => item.value === c.value) === index;
      })
    : todosNovos;

  const getCellClasses = (i: number, b: number, value: number) => {
    const isTargetCell = hotCell?.i === i && hotCell?.b === b;
    const sameValue = hotValue !== null && value === hotValue;
    const rowHot = isHotAxis("row", i);
    const colHot = isHotAxis("col", b);
    const axisHot = rowHot || colHot;

    const parity = axisValueParity.get(value) ?? 0;

    const stripeClass = axisHot
      ? parity % 2 === 0
        ? "bg-sky-500/30 font-bold text-sky-200 ring-1 ring-inset ring-sky-400/70"
        : "bg-blue-600/30 font-bold text-blue-300 ring-1 ring-inset ring-blue-500/70"
      : "";

    // Destaque de valores iguais: apenas quando o mouse está sobre uma célula
    const valueClass =
      sameValue && !axisHot ? "bg-sky-500/20 font-bold text-sky-200" : "";

    // Caminho da solução: não aplicar verde automaticamente
    const pathClass = "";

    // Célula sob o mouse
    const cellFocusClass = isTargetCell
      ? "bg-sky-500/30 font-bold text-sky-200 ring-1 ring-inset ring-sky-400/70"
      : "";

    return [
      "min-w-16 rounded-md border border-border/50 p-3 text-center font-mono transition-colors cursor-default bg-background/50",
      pathClass,
      stripeClass,
      valueClass,
      cellFocusClass,
    ]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background font-sans text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card p-4">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">
            Aula 07 · Programação dinâmica — Mochila 0/1
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Tabela T[i,b]: linhas para os itens e colunas para a capacidade.
          </p>
        </div>
        <div className="hidden gap-4 text-xs text-muted-foreground lg:flex">
          <span>
            <span className="mr-1 text-emerald-400">■</span> Caminho da solução
          </span>
          <span>
            <span className="mr-1 text-sky-300">■</span> Valores relacionados
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-96 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-4">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Capacidade C (kg)
            <Input
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="font-bold"
            />
          </label>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Itens
            </span>
            <Button size="sm" onClick={add}>
              + Item
            </Button>
          </div>

          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="p-1">i</th>
                <th className="p-1">pᵢ (peso)</th>
                <th className="p-1">vᵢ (valor)</th>
                <th className="p-1" />
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-1 text-center font-bold text-emerald-400">
                    {i + 1}
                  </td>
                  <td className="p-1">
                    <Input
                      className="h-7 px-2 text-center text-xs"
                      type="number"
                      min={1}
                      value={it.p}
                      onChange={(e) => update(i, { p: toNum(e.target.value) })}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      className="h-7 px-2 text-center text-xs"
                      type="number"
                      min={1}
                      value={it.v}
                      onChange={(e) => update(i, { v: toNum(e.target.value) })}
                    />
                  </td>
                  <td className="p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-1.5 text-rose-400"
                      disabled={items.length <= 1}
                      onClick={() => remove(i)}
                    >
                      ✕
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Button
            className="w-full bg-emerald-500 font-bold text-slate-950 hover:bg-emerald-400"
            onClick={calculate}
          >
            Calcular tabela
          </Button>
        </aside>

        {/* Centro: Tabela T[i,b] */}
        <main className="min-w-0 flex-1 overflow-auto p-6">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="min-w-0">
              <div className="overflow-x-auto rounded-xl border border-border bg-card/30 p-3">
                <table className="border-separate border-spacing-1 text-sm">
                  <thead>
                    <tr>
                      <th className="min-w-16 rounded-md bg-muted/80 p-3 text-center font-bold text-muted-foreground">
                        i \ b
                      </th>

                      {result.table[0].map((c) => (
                        <th
                          key={c.b}
                          onMouseEnter={() =>
                            setHotAxis({ kind: "col", idx: c.b })
                          }
                          onMouseLeave={() => setHotAxis(null)}
                          className={`cursor-default rounded-md bg-muted/80 p-3 text-center font-bold transition-colors ${
                            colunasReconstrucao.has(c.b)
                              ? "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-400/40"
                              : isHotAxis("col", c.b)
                                ? "text-sky-300"
                                : "text-muted-foreground"
                          }`}
                        >
                          {c.b}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {result.table.map((row, i) => (
                      <tr key={i}>
                        <th
                          onMouseEnter={() =>
                            setHotAxis({ kind: "row", idx: i })
                          }
                          onMouseLeave={() => setHotAxis(null)}
                          className={`min-w-16 cursor-default rounded-md bg-muted/60 p-3 text-center font-bold transition-colors ${
                            isHotAxis("row", i)
                              ? "bg-sky-500/20 font-bold text-sky-300 ring-1 ring-sky-400/50"
                              : "text-muted-foreground"
                          }`}
                        >
                          {i}
                        </th>

                        {row.map((c) => {
                          const key = `${c.i}-${c.b}`;

                          const visitada =
                            c.i > 0 && reconstrução.visitadas.has(key);

                          const selecionada =
                            reconstrução.selecionadas.has(key);

                          return (
                            <td
                              key={c.b}
                              onMouseEnter={() => {
                                setHotValue(c.value);
                                setHotCell({ i: c.i, b: c.b });
                              }}
                              onMouseLeave={() => {
                                setHotValue(null);
                                setHotCell(null);
                              }}
                              className={`relative ${getCellClasses(c.i, c.b, c.value)} ${
                                visitada && !selecionada
                                  ? "!border-sky-400/70"
                                  : ""
                              } ${
                                selecionada
                                  ? "!border-emerald-400 !bg-emerald-500/20"
                                  : ""
                              }`}
                            >
                              {c.value}

                              {selecionada && (
                                <span className="pointer-events-none absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-lg border border-border bg-card/50 p-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Valor ótimo
                    </span>

                    <span className="text-2xl font-bold text-emerald-400">
                      {result.best}
                    </span>
                  </div>

                  <div className="h-10 w-px bg-border" />

                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Itens escolhidos
                    </span>

                    <span className="text-sm font-medium">
                      {result.selected.length
                        ? juntar(result.selected)
                        : "Nenhum item"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Sidebar direita: Partes 2 e 3 com scroll */}
            <aside className="flex min-w-0 flex-col gap-6 rounded-lg border border-border bg-card/40 p-4">
              <div>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
                  Cálculo das células com valor novo
                </h2>
                <p className="mb-2 text-xs text-muted-foreground">
                  Contas que geraram valores novos. Passe o mouse para ver a
                  condição.
                </p>
                <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={mostrarApenasDistintos}
                    onChange={(e) =>
                      setMostrarApenasDistintos(e.target.checked)
                    }
                    className="h-3.5 w-3.5 cursor-pointer accent-emerald-500"
                  />
                  Mostrar apenas resultados distintos
                </label>
                {novos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum valor novo: todas as células copiam a linha de cima.
                  </p>
                ) : (
                  <ol className="flex flex-col font-mono text-xs">
                    {novos.map((c, index) => {
                      const key = `${c.i}-${c.b}`;
                      const rawCalc = String(c.calc ?? "");

                      const { contaLimpa, tooltipText } = processarCondicao(
                        rawCalc,
                        c.i,
                        c.b,
                        items[c.i - 1],
                      );

                      const contaComValores = formatarContaComValores(
                        contaLimpa,
                        c,
                        result.table,
                        items,
                      );

                      const textoConta = calculado
                        ? contaComValores
                        : "max(t[i-1,b], t[i-1, b-pi] + vi)";

                      const cellActive =
                        hotCell?.i === c.i && hotCell?.b === c.b;
                      const showTooltip = hoveredCalcKey === key;

                      // Detecta se mudou o i em relação à conta anterior
                      const mudouItem = index > 0 && novos[index - 1].i !== c.i;

                      return (
                        <li
                          key={key}
                          className={`relative leading-relaxed ${
                            mudouItem ? "mt-3" : ""
                          }`}
                        >
                          <span
                            onMouseEnter={() => setHotCell({ i: c.i, b: c.b })}
                            onMouseLeave={() => setHotCell(null)}
                            className={`cursor-pointer rounded px-1 py-0.5 transition-colors ${
                              cellActive
                                ? "bg-sky-500/30 font-bold text-sky-200 ring-1 ring-sky-400/70"
                                : "text-emerald-400 hover:bg-sky-500/20"
                            }`}
                          >
                            {`T[${c.i},${c.b}]`}
                          </span>

                          {": "}

                          <span
                            onMouseEnter={() => setHoveredCalcKey(key)}
                            onMouseLeave={() =>
                              setHoveredCalcKey((prev) =>
                                prev === key ? null : prev,
                              )
                            }
                            className="relative inline-block cursor-help rounded px-0.5 hover:bg-muted/60"
                          >
                            {textoConta}

                            {showTooltip && (
                              <span
                                role="tooltip"
                                className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 whitespace-nowrap rounded-md border border-sky-400/40 bg-slate-900 px-2.5 py-1 font-sans text-xs font-medium text-sky-200 shadow-lg"
                              >
                                {tooltipText}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
                  Reconstrução da solução
                </h2>
                <ol className="flex flex-col gap-1.5 text-sm">
                  {result.trace.map((t, k) => (
                    <li key={k} className="leading-relaxed">
                      {renderComRefsCelula(String(t), hotCell, setHotCell)}
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
